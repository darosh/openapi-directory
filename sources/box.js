import { listGitHubFiles, rawGitHubUrl } from '../lib/remote'

export function box () {
  return listGitHubFiles('box', 'box-openapi', '**/*.json')
    .then(files => files.map(filename => ({
      info: {
        'x-providerName': 'box.com',
        'x-serviceName': serviceName(filename),
        'x-origin': [{
          url: rawGitHubUrl('box', 'box-openapi', filename),
          format: 'swagger',
          version: '2.0'
        }]
      }
    })))
}

box.provider = 'box.com'

function serviceName (filename) {
  const components = filename.split('/')
  const name = components.pop()
  return (name === 'openapi-v2.json') ? 'content' : name.split('.')[0]
}
