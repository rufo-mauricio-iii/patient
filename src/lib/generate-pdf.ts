export function openPrintableDocument(html: string, title: string): void {
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Please allow pop-ups to view documents.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
  newWindow.document.title = title;
}
