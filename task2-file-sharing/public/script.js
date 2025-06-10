document.getElementById('uploadForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const statusDiv = document.getElementById('status');
  const linkDiv = document.getElementById('downloadLink');

  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    statusDiv.textContent = 'Status: Please select a file';
    return;
  }

  statusDiv.textContent = 'Status: Uploading...';
  linkDiv.textContent = '';

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: new FormData(document.getElementById('uploadForm')),
    });
    const data = await response.json();
    if (response.ok) {
      statusDiv.textContent = 'Status: Upload successful';
      linkDiv.innerHTML = `<a href="${data.link}" target="_blank">${data.link}</a>`;
    } else {
      statusDiv.textContent = `Status: Error - ${data.message}`;
    }
  } catch (error) {
    statusDiv.textContent = 'Status: Upload failed';
    console.error(error);
  }
});