document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusDiv = document.getElementById('status');
    const linkDiv = document.getElementById('downloadLink');
    const progressBar = document.getElementById('progressBar');
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const authToken = document.getElementById('authToken');

    if (!fileInput || !(fileInput instanceof HTMLInputElement) || !fileInput.files || !fileInput.files[0]) {
        statusDiv.textContent = 'Status: Please select a file';
        if (progressBar) progressBar.value = 0;
        return;
    }

    if (!authToken || !(authToken instanceof HTMLInputElement) || !authToken.value) {
        statusDiv.textContent = 'Status: Please enter a valid token';
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
            headers: {
                'Authorization': authToken.value 
            }
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Status: Upload successful';
            linkDiv.innerHTML = `<span class="download-link" data-href="/download/${data.link.split('/').pop()}" data-token="${authToken.value}">${data.link}</span>`;
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
        const authToken = document.getElementById('authToken');
        if (!authToken || !(authToken instanceof HTMLInputElement)) {
            console.warn('Auth token input not found or invalid');
            return;
        }
        const token = authToken.value;
        if (!token) {
            console.warn('No token provided for file list update');
            return;
        }
        const response = await fetch('http://localhost:3000/files', {
            headers: {
                'Authorization': token 
            }
        });
        const files = await response.json();
        if (response.ok) {
            const fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.innerHTML = '';
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = `${file.filename} (Uploaded: ${new Date(file.uploadedAt).toLocaleString()}) `;
                    const link = document.createElement('span');
                    link.className = 'download-link';
                    link.textContent = 'Download';
                    link.setAttribute('data-href', `/download/${file.filename}`);
                    link.setAttribute('data-token', token); 
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
        const authToken = document.getElementById('authToken');
        if (!authToken || !(authToken instanceof HTMLInputElement)) {
            console.warn('Auth token input not found or invalid');
            return;
        }
        const token = authToken.value;
        if (!token) {
            console.warn('No token provided for stats update');
            return;
        }
        const response = await fetch('http://localhost:3000/stats', {
            headers: {
                'Authorization': token 
            }
        });
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

document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('download-link')) {
        event.preventDefault();
        const href = target.getAttribute('data-href');
        const token = target.getAttribute('data-token');
        if (!href || !token) {
            console.error('Missing href or token for download');
            return;
        }
        fetch(href, {
            headers: { 'Authorization': token }
        }).then(res => {
            if (!res.ok) throw new Error('Download failed: ' + res.statusText);
            return res.blob();
        }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = href.split('/').pop() || 'file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }).catch(error => {
            console.error('Download error:', error);
        });
    }
});