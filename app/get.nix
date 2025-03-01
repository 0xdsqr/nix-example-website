{ }:
let
  # Define base paths
  staticDir = toString ../static;
  htmlDir = staticDir + "/html";
  jsDir = staticDir + "/js";
  
  # Read HTML files
  homeHtml = builtins.readFile (htmlDir + "/home.html");
  nixHtml = builtins.readFile (htmlDir + "/nix.html");
  appJs = builtins.readFile (jsDir + "/app.js");
  
  # Replace placeholders in the Nix page
  nixHtmlWithValues = 
    builtins.replaceStrings 
      ["NIX_SYSTEM_PLACEHOLDER" "NIX_VERSION_PLACEHOLDER"] 
      [builtins.currentSystem builtins.nixVersion] 
      nixHtml;
  
  # Add JavaScript to both pages
  homeHtmlWithJs = builtins.replaceStrings 
    ["// This will be replaced with the content of app.js"] 
    [appJs] 
    homeHtml;
    
  nixHtmlWithJs = builtins.replaceStrings 
    ["// This will be replaced with the content of app.js"] 
    [appJs] 
    nixHtmlWithValues;
  
  # Define routes
  routes = {
    "/" = homeHtmlWithJs;
    "/nix" = nixHtmlWithJs;
  };
  
  # 404 page
  notFoundHtml = ''
    <html>
      <head>
        <title>Nix web server - Not found</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #e74c3c;
          }
          a {
            color: #8c52ff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>404 - Page not found</h1>
        <p>The page you requested could not be found.</p>
        <p><a href="/">Return to home page</a></p>
      </body>
    </html>
  '';
  
  getContent = route: if builtins.hasAttr route routes then routes."${route}" else 
    builtins.replaceStrings ["not found"] ["${route} not found"] notFoundHtml;
    
in getContent
