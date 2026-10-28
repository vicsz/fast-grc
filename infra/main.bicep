// One App Service plan shared by all environments; one web app per environment.
targetScope = 'resourceGroup'

@allowed(['dev', 'demo'])
param env string

// New subscriptions get region-specific quotas: this one has App Service F1 quota in
// Canada East but not Canada Central, and Postgres only in Canada Central (the resource
// group's region). Both stay in Canada; co-locate later by requesting F1 quota.
param appLocation string = 'canadaeast'

@description('Globally unique; becomes https://<appName>.azurewebsites.net')
param appName string = 'fast-grc-${env}'

@allowed(['F1', 'B1'])
param planSku string = 'F1'

@secure()
@description('Postgres admin password; generated once by scripts/deploy.sh and kept only in app settings')
param dbPassword string

var dbAdmin = 'fastgrc'
var dbName = 'fast_grc_${env}'

// Free-offer shape only: Burstable B1ms, 32 GB, no storage auto-grow, no HA, no geo backup.
resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: 'fast-grc-pg'
  location: resourceGroup().location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '18'
    administratorLogin: dbAdmin
    administratorLoginPassword: dbPassword
    storage: { storageSizeGB: 32, autoGrow: 'Disabled' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

// Azure only allows extensions on this list; btree_gist backs the time-range constraints.
resource pgExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2025-08-01' = {
  parent: pg
  name: 'azure.extensions'
  properties: { value: 'BTREE_GIST', source: 'user-override' }
}

// Only Azure-hosted services (including App Service) can connect, not the whole internet.
resource pgAzureAccess 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2025-08-01' = {
  parent: pg
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

// One database per environment on the shared server.
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-08-01' = {
  parent: pg
  name: dbName
  dependsOn: [pgExtensions]
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'fast-grc-plan'
  location: appLocation
  kind: 'linux'
  sku: { name: planSku }
  properties: { reserved: true }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: appLocation
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
        {
          name: 'DATABASE_URL'
          value: 'postgres://${dbAdmin}:${dbPassword}@${pg.properties.fullyQualifiedDomainName}:5432/${database.name}?sslmode=require'
        }
        // dev resets and replays when an older build is deployed; other environments refuse.
        { name: 'DB_RESET_ON_DRIFT', value: string(env == 'dev') }
        // The zip is a complete, prebuilt artifact: no build on the server.
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
      ]
    }
  }
}

output url string = 'https://${app.properties.defaultHostName}'
