export function openPrintableDocument(html: string, title: string): void {
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Please allow pop-ups to view documents.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
  newWindow.document.title = title;

  // Auto-trigger print dialog after content loads so user can save as PDF
  newWindow.onload = () => {
    newWindow.print();
  };
  // Fallback for browsers that fire load before content renders
  setTimeout(() => {
    try {
      newWindow.print();
    } catch {
      // Window may have been closed by user
    }
  }, 500);
}
