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

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    const detailTitle = document.getElementById('detailTitle');
    const detailCompany = document.getElementById('detailCompany');
    const detailLocation = document.getElementById('detailLocation');
    const detailTime = document.getElementById('detailTime');
    const detailDescription = document.getElementById('detailDescription');
    const detailContact = document.getElementById('detailContact');
    const detailBadge = document.getElementById('detailBadge');
    const detailApplyBtn = document.getElementById('detailApplyBtn');

    if (!jobId) {
        detailTitle.textContent = 'Không tìm thấy tin tuyển dụng';
        detailDescription.textContent = 'Tin không tồn tại hoặc liên kết bị hỏng.';
        detailContact.textContent = 'Vui lòng quay lại trang chủ để xem danh sách tin.';
        detailApplyBtn.style.display = 'none';
        return;
    }

    db.collection('jobs').where('id', '==', Number(jobId)).limit(1).get()
        .then(snapshot => {
            if (snapshot.empty) {
                detailTitle.textContent = 'Không tìm thấy tin tuyển dụng';
                detailDescription.textContent = 'Tin không tồn tại hoặc liên kết bị hỏng.';
                detailContact.textContent = 'Vui lòng quay lại trang chủ để xem danh sách tin.';
                detailApplyBtn.style.display = 'none';
                return;
            }

            const job = snapshot.docs[0].data();
            detailTitle.textContent = job.title || 'Tin tuyển dụng';
            detailCompany.innerHTML = '<i class="fas fa-building"></i> ' + (job.company || 'Công ty');
            detailLocation.textContent = job.location || 'Không rõ';
            detailTime.textContent = job.time || 'Vừa đăng';
            detailDescription.textContent = job.description || 'Không có mô tả.';
            detailBadge.textContent = job.type === 'tìm người' ? 'Tuyển dụng' : 'Tin việc';
            detailBadge.className = 'detail-badge ' + (job.type === 'tìm người' ? 'tim-nguoi' : 'tim-viec');
            detailContact.textContent = job.company ? 'Liên hệ với ' + job.company + ' để biết thêm thông tin chi tiết.' : 'Vui lòng liên hệ qua email hoặc số điện thoại được cung cấp.';
            detailApplyBtn.href = 'apply.html?id=' + job.id;
            detailApplyBtn.textContent = 'Ứng tuyển ngay';
        })
        .catch(error => {
            console.error(error);
            detailTitle.textContent = 'Không thể tải tin tuyển dụng';
            detailDescription.textContent = 'Đã có lỗi xảy ra khi tải dữ liệu.';
            detailContact.textContent = 'Vui lòng thử lại sau.';
            detailApplyBtn.style.display = 'none';
        });
})();
