import faviconUrl from "./assets/favicon.png"

// Set favicon dynamically
const setFavicon = () => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement("link")
  link.type = "image/png"
  link.rel = "shortcut icon"
  link.href = faviconUrl
  document.getElementsByTagName("head")[0].appendChild(link)
}

// Set favicon when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setFavicon)
} else {
  setFavicon()
}
