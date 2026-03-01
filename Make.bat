rem Script that bundles everything and compresses with a 7zip

awk "FNR==1 && NR!=1 {print \";\"} 1" Json.js Css.js Js.js Html.js > Minifiers.js

7z a MAYO.zip index.html Main.js Minifiers.js jszip.min.js Style.css "nuh uh.png" Github.svg Tahoma8pt.woff2