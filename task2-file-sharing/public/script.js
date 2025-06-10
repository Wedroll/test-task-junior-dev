document.getElementById('uploadForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const statusDiv = document.getElementById('status');
  const linkDiv = document.getElementById('downloadLink');
  const progressBar = document.getElementById('progressBar');

  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    statusDiv.textContent = 'Status: Please select a file';
    progressBar.value = 0;
    return;
  }

  statusDiv.textContent = 'Status: Uploading...';
  progressBar.value = 0;

  const formData = new FormData(document.getElementById('uploadForm'));

  try {
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      statusDiv.textContent = 'Status: Upload successful';
      linkDiv.innerHTML = `<a href="${data.link}" target="_blank">${data.link}</a>`;
      progressBar.value = 100;
    } else {
      statusDiv.textContent = `Status: Error - ${data.message}`;
      progressBar.value = 0;
    }
  } catch (error) {
    statusDiv.textContent = 'Status: Upload failed';
    progressBar.value = 0;
    console.error(error);
  }
});