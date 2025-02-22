const fs = require("fs");
const os = require("os");
const path = require("path");

const core = require("@actions/core");
const gh = require("@actions/github");
const tc = require("@actions/tool-cache");

/**
 * Get the GitHub release object for the specified version/tag.
 * Throws an error if the release is not found or request fails.
 */
async function getRelease(octokit, version) {
  try {
    if (version === "latest") {
      return await octokit.rest.repos.getLatestRelease({
        owner: "VirtusLab",
        repo: "render",
      });
    } else {
      return await octokit.rest.repos.getReleaseByTag({
        owner: "VirtusLab",
        repo: "render",
        tag: version,
      });
    }
  } catch (e) {
    throw new Error(`Could not find release for version '${version}': ${e.message}`);
  }
}

/**
 * Convert Node's arch naming to what's needed by the render release assets.
 */
function mapArch(arch) {
  const mappings = {
    ia32: "386",
    x64: "amd64",
  };
  return mappings[arch] || arch;
}

/**
 * Convert Node's os.platform() to the naming used by the render release assets.
 */
function mapOS(osPlatform) {
  const mappings = {
    win32: "windows",
  };
  return mappings[osPlatform] || osPlatform;
}

/**
 * Main setup function: downloads the specified version of render,
 * makes it executable, places it on the PATH, and sets the output.
 */
async function setup() {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN environment variable is required to fetch releases from GitHub.");
    }

    const octokit = gh.getOctokit(GITHUB_TOKEN);

    const version = core.getInput("render-version") || "latest";
    core.info(`Requested version: ${version}`);

    // Fetch the release from GitHub
    const release = await getRelease(octokit, version);
    if (!release || !release.data) {
      throw new Error("Release data is empty or undefined");
    }

    // Map current OS/Arch to the names used in the release assets
    const osPlatform = os.platform();
    const arch = os.arch();
    const desiredOS = mapOS(osPlatform);
    const desiredArch = mapArch(arch);

    // Find the relevant asset from the release
    const asset = release.data.assets.find((a) =>
      a.name.endsWith(`render-${desiredOS}-${desiredArch}`)
    );
    if (!asset) {
      throw new Error(`Could not find asset for platform=${desiredOS}, arch=${desiredArch}`);
    }
    core.info(`Found asset: ${asset.name}`);

    // Download to a consistent filename in the runner temp directory
    const filename = osPlatform === "win32" ? "render.exe" : "render";
    const downloadPath = path.join(process.env.RUNNER_TEMP, filename);

    core.info(`Downloading from URL: ${asset.browser_download_url}`);
    core.info(`Saving to path: ${downloadPath}`);

    const pathToCLI = await tc.downloadTool(asset.browser_download_url, downloadPath);
    fs.chmodSync(pathToCLI, 0o755);

    // Add the tool to the PATH for subsequent steps
    core.addPath(process.env.RUNNER_TEMP);

    // Expose the installed version via action output
    const installedVersion = release.data.tag_name;
    core.setOutput("render-version", installedVersion);
    core.info(`Render version ${installedVersion} installed successfully.`);
  } catch (err) {
    core.setFailed(err.message);
  }
}

module.exports = setup;

// If run directly rather than imported, invoke setup
if (require.main === module) {
  setup();
}
