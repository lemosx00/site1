// Estado Global
let allTodos = JSON.parse(localStorage.getItem('allTodos')) || {};
let currentFilter = 'pending';
const calendarInput = document.getElementById('calendar-input');
const routineModal = document.getElementById('routine-modal');

// --- LÓGICA DE DATA E RELÓGIO ---

function getTodayString() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

let selectedDate = sessionStorage.getItem('selectedDate') || getTodayString();
calendarInput.value = selectedDate;

function atualizarPainelTempo() {
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    const s = String(agora.getSeconds()).padStart(2, '0');
    document.getElementById('relogio-digital').innerText = `${h}:${m}:${s}`;
    
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const partesData = selectedDate.split('-');
    const dataRef = new Date(partesData[0], partesData[1] - 1, partesData[2]);
    const diaFormatado = String(dataRef.getDate()).padStart(2, '0');
    const mesFormatado = String(dataRef.getMonth() + 1).padStart(2, '0');
    const nomeDia = diasSemana[dataRef.getDay()];
    
    document.getElementById('data-atual').innerText = `${diaFormatado}/${mesFormatado} - ${nomeDia}`;

    if (h === "00" && m === "00" && s === "00") {
        selectedDate = getTodayString();
        calendarInput.value = selectedDate;
        sessionStorage.setItem('selectedDate', selectedDate);
        render();
    }
}
setInterval(atualizarPainelTempo, 1000);

calendarInput.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    sessionStorage.setItem('selectedDate', selectedDate);
    render();
});

// --- FUNÇÃO DA BARRA DE PROGRESSO ---

function updateProgressBar() {
    const tarefasDoDia = allTodos[selectedDate] || [];
    const total = tarefasDoDia.length;
    const concluidas = tarefasDoDia.filter(t => t.completed).length;
    
    const porcentagem = total === 0 ? 0 : Math.round((concluidas / total) * 100);
    
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    
    if (bar && text) {
        bar.style.width = porcentagem + '%';
        text.innerText = `${porcentagem}% concluído`;
    }
}

// --- FUNÇÃO RENDER ---

function render() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    const agora = new Date();
    const tarefasDoDia = allTodos[selectedDate] || [];

    const filtered = tarefasDoDia.filter(t => {
        if (currentFilter === 'pending') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
    });

    filtered.forEach(todo => {
        const li = document.createElement('li');
        let estaAtrasada = false;
        if (todo.time && !todo.completed) {
            const [h, m] = todo.time.split(':');
            const dataTarefa = new Date(selectedDate + 'T' + h + ':' + m + ':00');
            if (dataTarefa < agora) estaAtrasada = true;
        }

        li.className = todo.completed ? 'completed' : (estaAtrasada ? 'atrasada' : '');
        const corStatus = todo.completed ? '' : getSemaforoClass(todo.time, agora);

        li.innerHTML = `
            <div class="todo-content">
                <span class="todo-text">${todo.text}</span>
            </div>
            <div class="todo-info">
                ${todo.time ? `<span class="todo-time-badge ${corStatus}">${todo.time}</span>` : ''}
            </div>
            <div class="actions">
                <button class="btn-check" onclick="toggleTodo(${todo.id})">✓</button>
                <button class="btn-del" onclick="deleteTodo(${todo.id})">✕</button>
            </div>
        `;
        todoList.appendChild(li);
    });

    // Atualiza a barra sempre que a lista for desenhada
    updateProgressBar();
}

function getSemaforoClass(time, agora) {
    if (!time) return 'status-verde';
    const [h, m] = time.split(':');
    const dataTarefa = new Date(selectedDate + 'T' + h + ':' + m + ':00');
    const diff = (dataTarefa - agora) / 60000;
    if (diff < 0) return 'status-vermelho';
    if (diff <= 15) return 'status-vermelho';
    if (diff <= 60) return 'status-amarelo';
    return 'status-verde';
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const timeInput = document.getElementById('todo-time');
    if (input.value.trim() === '') return;
    if (!allTodos[selectedDate]) allTodos[selectedDate] = [];
    allTodos[selectedDate].push({
        id: Date.now(),
        text: input.value,
        time: timeInput.value,
        completed: false
    });
    input.value = '';
    timeInput.value = '';
    save();
}

// --- MODAL E ROTINAS ---

document.getElementById('routine-btn').onclick = () => {
    routineModal.style.display = 'block';
    document.getElementById('routine-start').value = selectedDate;
    document.getElementById('routine-end').value = selectedDate;
};

function closeRoutineModal() { routineModal.style.display = 'none'; }

function saveRoutine() {
    const text = document.getElementById('routine-text').value.trim();
    const startStr = document.getElementById('routine-start').value;
    const endStr = document.getElementById('routine-end').value;

    if (!text || !startStr || !endStr) return;

    let currentDate = new Date(startStr + "T12:00:00");
    const endDate = new Date(endStr + "T12:00:00");

    while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        if (!allTodos[dateKey]) allTodos[dateKey] = [];
        allTodos[dateKey].push({
            id: Date.now() + Math.random(),
            text: text,
            time: "", 
            completed: false
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    save();
    closeRoutineModal();
}

// --- AÇÕES E FILTROS ---

function toggleTodo(id) {
    allTodos[selectedDate] = allTodos[selectedDate].map(t => {
        if (t.id === id) {
            if (!t.completed && typeof confetti === 'function') confetti();
            return { ...t, completed: !t.completed };
        }
        return t;
    });
    save();
}

function deleteTodo(id) {
    allTodos[selectedDate] = allTodos[selectedDate].filter(t => t.id !== id);
    save();
}

function filterTasks(type) {
    currentFilter = type;
    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    document.getElementById(`filter-${type}`).classList.add('active');
    render();
}

function save() {
    localStorage.setItem('allTodos', JSON.stringify(allTodos));
    render();
}

// --- INICIALIZAÇÃO ---

document.getElementById('add-btn').addEventListener('click', addTodo);
document.getElementById('todo-input').addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());

atualizarPainelTempo();
render();
setInterval(render, 30000);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}