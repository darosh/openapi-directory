import path from 'path'
import { listGitHubFiles, rawGitHubUrl } from '../lib/remote'

export function azure () {
  return listGitHubFiles('Azure', 'azure-rest-api-specs', '**/swagger/*.json')
    .then(files => files.filter(f => (f.split('/').length === 4)).map(filename => {
      // Workaround for https://github.com/Azure/azure-rest-api-specs/issues/229
      let service = filename.split('/')[0]
      const base = path.basename(filename, '.json')

      if (['arm-compute', 'arm-machinelearning'].indexOf(service) !== -1 && !service.endsWith(base)) {
        service += '-' + base
      }

      return {
        info: {
          'x-providerName': 'azure.com',
          'x-serviceName': service,
          'x-origin': [{
            url: rawGitHubUrl('Azure', 'azure-rest-api-specs', filename),
            format: 'swagger',
            version: '2.0'
          }]
        }
      }
    }))
}

azure.provider = 'azure.com'
