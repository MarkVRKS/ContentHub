// Дефолтные узлы, если база пуста
const DEFAULT_PARTNERS = [
    { id: 'p_1', name: 'MAILOPOST', desc: 'Email-маркетинг и массовые рассылки', url: 'https://mailopost.ru/' },
    { id: 'p_2', name: 'SMMPLANNER', desc: 'Планирование операций и шаблоны публикаций', url: 'https://smmplanner.com/home/templates/5762' },
    { id: 'p_3', name: 'АРХИВ СЕМЬИ (GITHUB)', desc: 'Резервное копирование и контроль версий кода', url: 'https://github.com' }
];

export function initPartners() {
    if (!localStorage.getItem('mafia_partners')) {
        localStorage.setItem('mafia_partners', JSON.stringify(DEFAULT_PARTNERS));
    }
    renderPartners();
}

export function getPartners() {
    return JSON.parse(localStorage.getItem('mafia_partners') || '[]');
}

export function savePartnersData(partners) {
    localStorage.setItem('mafia_partners', JSON.stringify(partners));
}

export function renderPartners() {
    const list = document.getElementById('partnersListContainer');
    if (!list) return;

    const partners = getPartners();
    
    list.innerHTML = partners.map(p => `
        <div class="partner-card" onclick="window.openLink('${p.url}')">
            <div class="partner-info">
                <h4>${p.name}</h4>
                <p>${p.desc}</p>
            </div>
            <div class="partner-action">
                <span class="partner-status">АКТИВЕН</span>
                <button class="partner-edit-btn" onclick="event.stopPropagation(); window.openPartnerModal('${p.id}')">[ ⚙ ]</button>
                <span class="partner-arrow">ПЕРЕЙТИ ↗</span>
            </div>
        </div>
    `).join('');
}

export function openPartnerModal(id = null) {
    const modal = document.getElementById('partner-modal');
    const title = document.getElementById('pm-title');
    const deleteBtn = document.getElementById('pm-delete');
    
    const inpId = document.getElementById('pm-id');
    const inpName = document.getElementById('pm-name');
    const inpDesc = document.getElementById('pm-desc');
    const inpUrl = document.getElementById('pm-url');

    // Сброс формы
    inpName.classList.remove('error');
    inpUrl.classList.remove('error');

    if (id) {
        // Режим редактирования
        const partner = getPartners().find(p => p.id === id);
        if (partner) {
            title.innerText = 'КОНФИГУРАЦИЯ УЗЛА';
            inpId.value = partner.id;
            inpName.value = partner.name;
            inpDesc.value = partner.desc;
            inpUrl.value = partner.url;
            deleteBtn.style.display = 'block';
        }
    } else {
        // Режим создания
        title.innerText = 'НОВЫЙ АЛЬЯНС';
        inpId.value = '';
        inpName.value = '';
        inpDesc.value = '';
        inpUrl.value = '';
        deleteBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

export function closePartnerModal() {
    document.getElementById('partner-modal').classList.remove('active');
}

export function savePartner() {
    const inpId = document.getElementById('pm-id').value;
    const inpName = document.getElementById('pm-name');
    const inpDesc = document.getElementById('pm-desc').value;
    const inpUrl = document.getElementById('pm-url');

    let isValid = true;
    if (!inpName.value.trim()) { inpName.classList.add('error'); isValid = false; } else { inpName.classList.remove('error'); }
    if (!inpUrl.value.trim()) { inpUrl.classList.add('error'); isValid = false; } else { inpUrl.classList.remove('error'); }

    if (!isValid) return;

    let partners = getPartners();

    if (inpId) {
        // Обновление
        const index = partners.findIndex(p => p.id === inpId);
        if (index !== -1) {
            partners[index] = { id: inpId, name: inpName.value, desc: inpDesc, url: inpUrl.value };
        }
    } else {
        // Создание
        partners.push({
            id: 'p_' + Date.now().toString(36),
            name: inpName.value,
            desc: inpDesc,
            url: inpUrl.value
        });
    }

    savePartnersData(partners);
    renderPartners();
    closePartnerModal();
}

export function deletePartner() {
    const id = document.getElementById('pm-id').value;
    if (!id) return;

    if (confirm('Ликвидировать узел связи? Это действие необратимо.')) {
        let partners = getPartners();
        partners = partners.filter(p => p.id !== id);
        savePartnersData(partners);
        renderPartners();
        closePartnerModal();
    }
}