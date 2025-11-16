const lockStack: string[] = [];

const getBody = () => (typeof document !== "undefined" ? document.body : null);

export function lockBodyScroll() {
  const body = getBody();
  if (!body) return;
  lockStack.push(body.style.overflow || "");
  body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  const body = getBody();
  if (!body) return;
  const previous = lockStack.pop();
  if (previous !== undefined) {
    body.style.overflow = previous;
  } else {
    body.style.overflow = "";
  }
}
