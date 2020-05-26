export function contextPathFromURL() {
    return window.location.pathname.match(/\/apps\/(.*?)\//)[1];
}
