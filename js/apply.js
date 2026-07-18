(function() {
    const firebaseConfig = {
        apiKey: 'AIzaSyCZn5vuwwmSuuu_cjE_z-6ZDAiN_pOj3wo',
        authDomain: 'find-job-b4311.firebaseapp.com',
        projectId: 'find-job-b4311',
        storageBucket: 'find-job-b4311.firebasestorage.app',
        messagingSenderId: '34102923819',
        appId: '1:34102923819:web:a625c25514df9619e5106e',
        measurementId: 'G-RGRJ8V33KM'
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');
    const jobTitle = document.getElementById('applyJobTitle');
    const applyBadge = document.getElementById('applyBadge');
    const applyForm = document.getElementById('applyForm');
    const applyMessage = document.getElementById('applyMessage');

    function showMessage(message, isError = false) {
        applyMessage.textContent = message;
        applyMessage.style.color = isError ? '#d9534f' : '#28a745';
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject(new Error('Không đọc được file CV.'));
            reader.readAsDataURL(file);
        });
    }

    if (!jobId) {
        jobTitle.textContent = 'Ứng tuyển';
        applyBadge.textContent = 'Ứng tuyển';
        showMessage('Đang gửi CV cho tin tuyển dụng chưa xác định.', false);
    } else {
        db.collection('jobs').where('id', '==', Number(jobId)).limit(1).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    jobTitle.textContent = 'Ứng tuyển';
                    applyBadge.textContent = 'Ứng tuyển';
                    showMessage('Đang gửi CV cho tin tuyển dụng đã chọn.', false);
                    return;
                }

                const job = snapshot.docs[0].data();
                jobTitle.textContent = job.title || 'Ứng tuyển';
                applyBadge.textContent = job.type === 'tìm người' ? 'Tuyển dụng' : 'Tin việc';
                applyBadge.className = 'detail-badge ' + (job.type === 'tìm người' ? 'tim-nguoi' : 'tim-viec');
            })
            .catch(error => {
                console.error(error);
                jobTitle.textContent = 'Ứng tuyển';
                applyBadge.textContent = 'Ứng tuyển';
                showMessage('Đang gửi CV cho tin tuyển dụng đã chọn.', false);
            });
    }

    applyForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const application = {
            jobId: jobId ? Number(jobId) : null,
            jobTitle: jobTitle.textContent,
            applicantName: document.getElementById('applicantName').value.trim(),
            applicantEmail: document.getElementById('applicantEmail').value.trim(),
            applicantPhone: document.getElementById('applicantPhone').value.trim(),
            applicantEducation: document.getElementById('applicantEducation').value.trim(),
            applicantExperience: document.getElementById('applicantExperience').value.trim(),
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!application.applicantName || !application.applicantEmail || !application.applicantPhone) {
            showMessage('Vui lòng nhập đủ họ tên, email và số điện thoại.', true);
            return;
        }

        try {
            const cvFileInput = document.getElementById('cvFile');
            const cvFile = cvFileInput && cvFileInput.files && cvFileInput.files[0];

            if (cvFile) {
                try {
                    const storageRef = storage.ref(`cvs/${Date.now()}_${cvFile.name}`);
                    await storageRef.put(cvFile);
                    const downloadUrl = await storageRef.getDownloadURL();
                    application.cvFileName = cvFile.name;
                    application.cvFileUrl = downloadUrl;
                    application.cvMimeType = cvFile.type || 'application/octet-stream';
                    application.cvStoredIn = 'storage';
                } catch (storageError) {
                    console.warn('Storage upload failed, falling back to Firestore:', storageError);
                    application.cvFileName = cvFile.name;
                    application.cvFileType = cvFile.type || 'application/octet-stream';
                    application.cvBase64 = await readFileAsBase64(cvFile);
                    application.cvStoredIn = 'firestore';
                }
            }

            await db.collection('applications').add(application);
            showMessage('CV của bạn đã được gửi thành công.');
            applyForm.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        } catch (error) {
            console.error(error);
            showMessage('Đã có lỗi khi gửi CV. Vui lòng thử lại.', true);
        }
    });
})();
