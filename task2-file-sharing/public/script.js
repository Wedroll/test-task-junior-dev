document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusDiv = document.getElementById('status');
    const linkDiv = document.getElementById('downloadLink');
    const progressBar = document.getElementById('progressBar');
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');

    if (!fileInput || !(fileInput instanceof HTMLInputElement) || !fileInput.files || !fileInput.files[0]) {
        statusDiv.textContent = 'Status: Please select a file';
        if (progressBar) progressBar.value = 0;
        return;
    }

    const file = fileInput.files[0];
    statusDiv.textContent = 'Status: Uploading...';
    if (progressBar) {
        progressBar.value = 0; 
        progressBar.style.display = 'block'; 
    }

    const formData = new FormData(form);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Status: Upload successful';
            linkDiv.innerHTML = `<a href="${data.link}" target="_blank">${data.link}</a>`;
            if (progressBar) {
                progressBar.value = 100; 
                setTimeout(() => {
                    progressBar.style.display = 'none'; 
                }, 1000); 
            }
            if (form) form.reset();
            if (fileInput) fileInput.value = ''; 
            updateFileList(); 
        } else {
            statusDiv.textContent = `Status: Error - ${data.message}`;
            if (progressBar) {
                progressBar.value = 0;
                progressBar.style.display = 'block'; 
            }
        }
    } catch (error) {
        statusDiv.textContent = 'Status: Upload failed';
        if (progressBar) {
            progressBar.value = 0;
            progressBar.style.display = 'block'; 
        }
        console.error('Fetch error:', error);
    }
});

async function updateFileList() {
    try {
        const response = await fetch('http://localhost:3000/files'); 
        const files = await response.json();
        if (response.ok) {
            const fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.innerHTML = ''; 
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = `${file.filename} (Uploaded: ${new Date(file.uploadedAt).toLocaleString()}) `;
                    const link = document.createElement('a');
                    link.href = `/download/${file.filename}`;
                    link.textContent = 'Download';
                    link.target = '_blank';
                    li.appendChild(link);
                    fileList.appendChild(li);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching file list:', error);
    }
}

async function updateStats() {
    try {
        const response = await fetch('http://localhost:3000/stats');
        const data = await response.json();
        if (response.ok) {
            document.getElementById('uploadCount').textContent = data.uploadCount;
            document.getElementById('downloadCount').textContent = data.downloadCount;
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

setInterval(() => {
    updateStats();
    updateFileList();
}, 5000);

updateStats();
updateFileList();