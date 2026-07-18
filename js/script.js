(function() {
    let jobs = [];
    let currentFilter = 'all';
    let searchKeyword = '';

    const grid = document.getElementById('jobGrid');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-tabs button');
    const toggleBtn = document.getElementById('toggleFormBtn');
    const postForm = document.getElementById('postForm');
    const cancelBtn = document.getElementById('cancelFormBtn');
    const submitBtn = document.getElementById('submitPostBtn');
    const titleInput = document.getElementById('titleInput');
    const companyInput = document.getElementById('companyInput');
    const typeSelect = document.getElementById('typeSelect');
    const locationInput = document.getElementById('locationInput');
    const salaryInput = document.getElementById('salaryInput');
    const descInput = document.getElementById('descInput');
    const viewCVBtn = document.getElementById('viewCVBtn');
    const cvModal = document.getElementById('cvJobModal');
    const cvModalClose = document.getElementById('cvModalClose');
    const cvJobList = document.getElementById('cvJobList');

    // ===== MODAL XEM CV =====
    function openCVModal() {
        if (!window.auth || !window.auth.currentUser) return;
        const userEmail = window.auth.currentUser.email;
        const myJobs = jobs.filter(job => job.authorEmail === userEmail);
        if (myJobs.length === 0) {
            alert('Bạn chưa đăng tin tuyển dụng nào.');
            return;
        }
        cvJobList.innerHTML = myJobs.map(job => `
            <div class="cv-job-item">
                <span>${escapeHtml(job.title)} (${escapeHtml(job.company)})</span>
                <a href="/cv-list.html?id=${job.id}" class="btn-apply">Xem CV</a>
            </div>
        `).join('');
        cvModal.style.display = 'flex';
    }

    function closeCVModal() {
        cvModal.style.display = 'none';
    }

    viewCVBtn.addEventListener('click', openCVModal);
    cvModalClose.addEventListener('click', closeCVModal);
    window.addEventListener('click', function(e) {
        if (e.target === cvModal) closeCVModal();
    });

    // ===== FIRESTORE =====
    function loadJobsFromFirestore() {
        window.db.collection('jobs').orderBy('createdAt', 'desc').get()
            .then(snapshot => {
                const firestoreJobs = [];
                snapshot.forEach(doc => {
                    firestoreJobs.push({
                        id: doc.data().id || doc.id,
                        title: doc.data().title,
                        company: doc.data().company,
                        type: doc.data().type,
                        location: doc.data().location,
                        salary: doc.data().salary,
                        description: doc.data().description,
                        time: doc.data().time || 'Vừa đăng',
                        authorEmail: doc.data().authorEmail
                    });
                });
                if (firestoreJobs.length > 0) {
                    jobs = firestoreJobs;
                }
                renderJobs();
                updateViewCVButton();
            })
            .catch(error => {
                console.error('Không thể tải tin từ Firestore:', error);
                renderJobs();
            });
    }

    function saveJobToFirestore(job) {
        return window.db.collection('jobs').add({
            ...job,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            authorEmail: window.auth.currentUser ? window.auth.currentUser.email : null
        });
    }

    // ===== RENDER =====
    function renderJobs() {
        const filtered = jobs.filter(job => {
            if (currentFilter !== 'all' && job.type !== currentFilter) return false;
            if (searchKeyword.trim() !== '') {
                const kw = searchKeyword.trim().toLowerCase();
                const match = job.title.toLowerCase().includes(kw) ||
                    job.company.toLowerCase().includes(kw) ||
                    job.location.toLowerCase().includes(kw) ||
                    job.description.toLowerCase().includes(kw);
                if (!match) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-inbox"></i>
                    <p>Không có tin nào phù hợp.</p>
                </div>
            `;
            return;
        }

        const currentUser = window.auth && window.auth.currentUser;
        const currentEmail = currentUser ? currentUser.email : null;

        grid.innerHTML = filtered.map(job => {
            const isTimNguoi = job.type === 'tìm người';
            const badgeClass = isTimNguoi ? 'tim-nguoi' : 'tim-viec';
            const applyLabel = isTimNguoi ? 'Ứng tuyển' : 'Liên hệ';
            const isOwner = currentEmail && job.authorEmail === currentEmail;

            return `
                <div class="job-card" data-id="${job.id}">
                    <div class="card-header">
                        <h3>${escapeHtml(job.title)}</h3>
                        <span class="badge-type ${badgeClass}">${isTimNguoi ? 'Tuyển dụng' : 'Tìm việc'}</span>
                    </div>
                    <div class="company">
                        <i class="fas fa-user-circle"></i> ${escapeHtml(job.company)}
                    </div>
                    <div class="desc">${escapeHtml(job.description)}</div>
                    <div class="meta">
                        <span><i class="fas fa-map-pin"></i> ${escapeHtml(job.location)}</span>
                        <span><i class="fas fa-dollar-sign"></i> ${escapeHtml(job.salary || 'Thỏa thuận')}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHtml(job.time)}</span>
                    </div>
                    <div class="card-footer">
                        <a class="btn-apply ${isTimNguoi ? '' : 'outline'}" href="job-detail.html?id=${job.id}">${applyLabel}</a>
                        ${isOwner ? `<a class="btn-apply outline" href="/cv-list.html?id=${job.id}"><i class="fas fa-file-alt"></i> Xem CV</a>` : ''}
                        <span class="time"><i class="far fa-calendar-alt"></i> ${escapeHtml(job.time)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // ===== ĐĂNG TIN =====
    function addJobFromForm() {
        if (!window.auth || !window.auth.currentUser) {
            alert('Vui lòng đăng nhập trước khi đăng tin.');
            if (window.openAuthForm) window.openAuthForm();
            return false;
        }

        const title = titleInput.value.trim();
        const company = companyInput.value.trim() || 'Người đăng ẩn danh';
        const type = typeSelect.value;
        const location = locationInput.value.trim() || 'Không rõ';
        const salary = salaryInput.value.trim() || 'Thỏa thuận';
        const description = descInput.value.trim() || 'Không có mô tả.';

        if (!title) {
            alert('Vui lòng nhập tiêu đề tin.');
            titleInput.focus();
            return false;
        }

        const newJob = {
            id: Date.now() + Math.random(),
            title: title,
            company: company,
            type: type,
            location: location,
            salary: salary,
            description: description,
            time: 'Vừa đăng'
        };

        saveJobToFirestore(newJob)
            .then(() => {
                jobs.unshift(newJob);
                renderJobs();
                closeForm();
                updateViewCVButton();
            })
            .catch(error => {
                console.error('Lưu tin vào Firestore thất bại:', error);
                alert('Đã có lỗi khi lưu tin. Vui lòng thử lại.');
            });

        return true;
    }

    function openForm() {
        postForm.classList.add('open');
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Đóng form';
    }

    function closeForm() {
        postForm.classList.remove('open');
        toggleBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Đăng tin mới';
        titleInput.value = '';
        companyInput.value = '';
        typeSelect.value = 'tìm người';
        locationInput.value = '';
        salaryInput.value = '';
        descInput.value = '';
    }

    function setFilter(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderJobs();
    }

    function setSearch(keyword) {
        searchKeyword = keyword;
        renderJobs();
    }

    function updateViewCVButton() {
        if (!window.auth || !window.auth.currentUser) {
            viewCVBtn.style.display = 'none';
            return;
        }
        const userEmail = window.auth.currentUser.email;
        const hasJob = jobs.some(job => job.authorEmail === userEmail);
        viewCVBtn.style.display = hasJob ? 'inline-flex' : 'none';
    }

    // ===== SỰ KIỆN =====
    toggleBtn.addEventListener('click', function() {
        if (postForm.classList.contains('open')) {
            closeForm();
        } else {
            openForm();
        }
    });

    cancelBtn.addEventListener('click', closeForm);

    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addJobFromForm();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });

    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearch(this.value);
        }, 250);
    });

    window.onAuthStateChanged = function(user) {
        loadJobsFromFirestore();
    };

    // Khởi tạo
    renderJobs();
    setFilter('all');
})();