import { serve } from "bun";
import { Database } from "bun:sqlite";

// Initialize SQLite database
const db = new Database("emails.sqlite");

// Create emails table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const server = serve({
  port: 3001,
  routes: {
    // Health endpoints
    "/health/status": new Response("OK", {
      headers: { "Content-Type": "text/plain" }
    }),
    
    "/health/ready": new Response(null, {
      status: 204
    }),
    
    // API endpoint to add a new email
    "/api/emails": {
      POST: async (req) => {
        try {
          const body = await req.json();
          
          if (!body.email || typeof body.email !== 'string') {
            return new Response("Invalid email", { status: 400 });
          }
          
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(body.email)) {
            return new Response("Invalid email format", { status: 400 });
          }
          
          // Try to insert the email
          try {
            db.run("INSERT INTO emails (email) VALUES (?)", body.email);
            return new Response("Email added successfully", { status: 201 });
          } catch (dbError) {
            // Check if it's a duplicate email error
            if (dbError.toString().includes("UNIQUE constraint failed")) {
              return new Response("Email already exists", { status: 409 });
            }
            throw dbError;
          }
        } catch (error) {
          console.error("Error adding email:", error);
          return new Response("Error adding email", { status: 500 });
        }
      }
    },
    
    // Explicit routes for our Nix app
    "/": async () => {
      return await getNixResponse("/");
    },
    
    "/nix": async () => {
      return await getNixResponse("/nix");
    },
    
    // For 404 testing
    "/404": async () => {
      return await getNixResponse("/404");
    },

    // Catch-all route for any other paths
    "/*": async (request) => {
      try {
        const url = new URL(request.url);
        const path = url.pathname;
        
        return await getNixResponse(path);
      } catch (error) {
        console.error(`Error processing route ${request.url}:`, error);
        return new Response("Server Error", { status: 500 });
      }
    }
  }
});

// Helper function to get Nix response
async function getNixResponse(path) {
  try {
    console.log(`Getting Nix response for path: ${path}`);
    
    const command = `nix eval --arg route "${path}" --raw -f ./app get`;
    console.log(`Executing: ${command}`);
    
    const proc = Bun.spawn(command.split(" "));
    
    const output = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    
    if (stderr) {
      console.error(`Nix stderr for ${path}:`, stderr);
    }
    
    if (!output) {
      console.error(`Empty output from Nix for ${path}`);
      return new Response("Error: Empty response from Nix", { status: 500 });
    }
    
    return new Response(output, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error(`Error processing route ${path}:`, error);
    return new Response(`Server Error: ${error.message}`, { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

// Count emails in the database
const emailCount = db.query("SELECT COUNT(*) as count FROM emails").get() as { count: number };

console.log(`🟪 Server running at http://localhost:${server.port}`);
console.log(`Health checks available at:
- http://localhost:${server.port}/health/status (200 OK)
- http://localhost:${server.port}/health/ready (204 No Content)`);
console.log(`Email database contains ${emailCount.count} entries`);
