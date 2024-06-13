// Данные с информацией:
let tableInfos = [];
let tableFilters = null;
let count = 0;
const limit = 10;

// Необходимые элементы:
const form = document.querySelector('form');
const table = document.querySelector('table');
const tableBody = document.querySelector('tbody');
const tableTitles = document.querySelectorAll('th');
const elementLoading = document.querySelector('hr');
const elementError = document.querySelector('p');

// Получение айдишников титульных тегов таблицы:
// Добавление контента в титульные теги:
const tableTitleIDs = Array.from(tableTitles).map(title => 
  title.textContent = title.id
);

// Получение данных о скроллах страницы:
function getInfoScroll() {
  return {
    scrollY: Math.ceil(window.scrollY + window.innerHeight),
    scrollHeight: document.body.scrollHeight
  }
}

// Создание ячейки с информацией:
function createTableData(text) {
  const tableData = document.createElement('td');

  tableData.textContent = text

  return tableData;
}

// Создание колонки с ячейками:
function createTableRow(data) {
  const tableRow = document.createElement('tr');

  tableRow.dataset.id = data.id;

  tableTitleIDs.forEach((tableTitleID) => {
    tableRow.appendChild(
      createTableData(data[tableTitleID])
    )
  });

  return tableRow;
}

// Создание/Удаление ошибки в таблице:
function toggleError({ isTable,  messageError}) {
  table.setAttribute('aria-hidden', !isTable);
  elementError.setAttribute('aria-hidden', isTable);

  elementError.textContent = messageError;
}

// Создание ошибки таблицы, если она пустая или выдает ошибку при запросе:
function createErrorEvent(messageError) {
  form.removeEventListener('submit', generateFilterTable);
  window.removeEventListener('scroll', generateUpdateAndScrollTable);
  window.removeEventListener('resize', generateRecursionTable);

  toggleError({ isTable: false, messageError });
}

// Генерация таблицы:
function generateTable(array = tableInfos) {
  const newCount = limit * count;

  if (array.length > newCount) {
    array.slice(newCount, newCount + limit)
      .forEach((info) => {
        tableBody.appendChild(
          createTableRow(info)
        )
      });
  }
}

// Фильтрация по поиску:
function generateFilterTable(event) {
  // Отключение дефолтного поведения формы:
  event.preventDefault();

  // Значение для запроса (поисквое слово):
  const { search } = Object.fromEntries(
    new FormData(event.currentTarget)
  );

  // Фильтрованный массив:
  tableFilters = tableInfos.filter((info) => (
    // Если хотя бы 1 значение верно, верни елемент массива:
    tableTitleIDs.some((tableTitleID) => {
      const data = String(info[tableTitleID]).toLowerCase();
      const param = search.trim().toLowerCase();

      return data.includes(param);
    })
  ));

  // Очистка при фильтрации:
  tableBody.innerHTML = '';
  count = 0;

  // Генерация фильтрованного массива |
  // Генерация ошибки пусто массива:
  if (!!tableFilters.length) {
    generateTable(tableFilters);
    toggleError({
      isTable: true,
      messageError: ''
    });
    generateRecursionTable(tableFilters);
  } else {
    toggleError({
      isTable: false,
      messageError: 'Данные не были найдены!'
    });
  }
}

// Апдейт/дополнение таблицы:
function generateUpdateTable() {
  const newTableDatas = Array.isArray(tableFilters) ? tableFilters : tableInfos;

  count++;

  generateTable(newTableDatas);
}

// Рекурсия для верного отображения таблицы:
function generateRecursionTable(array = tableInfos) {
  const { scrollY, scrollHeight } = getInfoScroll();

  if (scrollHeight > scrollY || array.length < limit * count) return; 

  generateUpdateTable();

  generateRecursionTable(array);
  // Апдейтим таблицу до тех пор пока не появится скролл
  // Или пока не закончатся все элементы!
}

// Появление элементов при скролле (95% для появления элементов):
function generateUpdateAndScrollTable() {
  const { scrollY, scrollHeight } = getInfoScroll();

  const procent = scrollY/scrollHeight * 100;

  if (procent < 95) return;

  generateUpdateTable();
}

// Fetch-запрос с получением данных для таблицы:
async function generateFetchTable() {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/altkraft/for-applicants/master/frontend/titanic/passengers.json'
    );

    if (!!!response.ok) {
      createErrorEvent('Ошибка при запросе данных!');
      return;
    }

    tableInfos = await response.json();

    if(!!!tableInfos.length) {
      createErrorEvent('Таблица оказалась пустой!');
    } else {
      generateTable();
      generateRecursionTable();
    }

  } catch (error) {
    createErrorEvent('Ошибка при запросе данных!');
  }
}

// Генерация таблицы или ошибки в зависимости от ответа запроса:
generateFetchTable();

// Фильтрация данных по поисковому значению:
form.addEventListener('submit', generateFilterTable);

// Подгрузка данных при скроллинге:
window.addEventListener('scroll', generateUpdateAndScrollTable);

// Подгрузка данных при масштабировании:
window.addEventListener('resize', generateRecursionTable);