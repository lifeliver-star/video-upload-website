document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const videoFile = document.getElementById('videoInput').files[0];
  const formData = new FormData();
  formData.append('video', videoFile);

  const message = document.getElementById('message');

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.text();
    message.textContent = result;
  } catch (err) {
    console.error(err);
    message.textContent = 'Upload failed.';
  }
});
