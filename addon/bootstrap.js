var ReadingQueueNumbers;

async function startup({ id, version, rootURI }) {
  Services.scriptloader.loadSubScript(rootURI + "reading-queue-numbers.js");
  await ReadingQueueNumbers.startup({ id, version, rootURI });
}

async function onMainWindowLoad({ window }) {
  ReadingQueueNumbers?.addToWindow(window);
}

function shutdown() {
  ReadingQueueNumbers?.shutdown();
  ReadingQueueNumbers = undefined;
}

function install() {}
function uninstall() {}
