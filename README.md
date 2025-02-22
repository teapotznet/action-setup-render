# action-setup-render

![Action Tests](https://github.com/teapotznet/action-setup-render/actions/workflows/test.yml/badge.svg)

Set up your GitHub Actions workflow with a specific version of render.

## Usage

Input `render-version` is optional; default is to install the latest version. See [render releases](https://github.com/VirtusLab/render/releases) for list of specific semver release tags.

### Basic

Add a step that calls `teapotznet/action-setup-render`, providing the `GITHUB_TOKEN` from the workflow as an environment variable.  **This is required**.

```yaml
steps:
- uses: actions/checkout@v4
- uses: teapotznet/action-setup-render@v1.0.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: render --version
```

### Specific Render Version

Optionally, you may also specify the semver release tag of a specific render release to be installed.

```yaml
steps:
- uses: actions/checkout@v3
- uses: teapotznet/action-setup-render@v1.0.0
  with:
    render-version: v0.3.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: render --version
```
