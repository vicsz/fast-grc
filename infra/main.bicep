// One App Service plan shared by all environments; one web app per environment.
targetScope = 'resourceGroup'

@allowed(['dev', 'demo'])
param env string

param location string = resourceGroup().location

@description('Globally unique; becomes https://<appName>.azurewebsites.net')
param appName string = 'fast-grc-${env}'

@allowed(['F1', 'B1'])
param planSku string = 'F1'

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'fast-grc-plan'
  location: location
  kind: 'linux'
  sku: { name: planSku }
  properties: { reserved: true }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'
      appCommandLine: 'node dist/main.js'
      alwaysOn: planSku != 'F1'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'APP_ENV', value: env }
        // The zip is a complete, prebuilt artifact: no build on the server.
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
      ]
    }
  }
}

output url string = 'https://${app.properties.defaultHostName}'
