const sonarqubeScanner = require('sonarqube-scanner')
 
sonarqubeScanner(
  {
    serverUrl : 'http://localhost:9000',
    //token : "019d1e2e04eefdcd0caee1468f39a45e69d33d3f",
    options: {
    }
  },
  () => process.exit()
)