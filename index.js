import { Liquid } from 'liquidjs'
import { getInput, setOutput, setFailed } from '@actions/core'
import { context } from '@actions/github'

try {
  // Input defined in action metadata file
  const EXTNAME = getInput('extname')
  const ROOT = getInput('root')
  const LAYOUTS = getInput('layouts')
  const PARTIALS = getInput('partials')
  const FILE = getInput('file')

  // Liquidjs engine
  const engine = new Liquid({
    extname: EXTNAME, // used for layouts/includes
    root: ROOT, // root files for `.render()` and `.parse()`
    layouts: LAYOUTS, // layout files for `{% layout %}`
    partials: PARTIALS, // partial files for `{% render %}`
    greedy: false, // don't trim all whitespace regardless of breaks
    trimTagLeft: true, // strip blank characters from the left of tags
  })

  // Render the file
  const RENDERED_CONTENT = await engine.renderFile(FILE)

  // Set the output
  setOutput('rendered-content', RENDERED_CONTENT)

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`)
} catch (error) {
  setFailed(error.message)
}
