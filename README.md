# Render Liquid File

This GitHub Action renders a given Liquid file and outputs the rendered content.

## Example usage

### Reusable workflow

```yaml
name: Render issue template from liquid file

on:
  workflow_call:
    inputs:
      file:
        description: 'The path of the liquid file to render'
        required: true
        type: string
    outputs:
      rendered-content:
        description: 'The rendered content of the liquid file'
        value: ${{ jobs.render-template.outputs.rendered-content }}

jobs:
  render-template:
    runs-on: ubuntu-latest
    outputs:
      rendered-content: ${{ steps.add-anchor-links.outputs.content }}
    steps:
      - uses: actions/checkout@v4
      - id: render-liquid-file
        uses: parkerbxyz/render-liquid-file@v1
        with:
          extname: .md.liquid
          root: templates
          layouts: templates/layouts
          partials: templates/partials
          file: ${{ inputs.file }}
```

## Inputs

More information on the following options can be found [here](https://liquidjs.com/tutorials/options.html).

### `extname`

The default extension name to be appended to filenames if the filename has no extension name. Defaults to `''` (disabled).

### `root`

**Required:** The root template directory to lookup and read template files for `.render()` and `.parse()`.

### `layouts`

The template directory to lookup files for `{% layout %}`. Defaults to `root` if not specified.

### `partials`

The template directory to lookup files for `{% render %}`. Defaults to `root` if not specified.

### `file`

**Required:** The name/path of the file to render.

## Outputs

### `rendered-content`

The content of the rendered file.
