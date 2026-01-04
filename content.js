let popupElement = null;
let checkInterval = null;

const API_BASE_URL = 'https://dev-akabis-160903.dev-bsscommerce.com/api';
const FIXED_USER_ID = '22f42425-602d-4219-867e-8810fdf852ca';
const CHECK_INTERVAL = 10000;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPopup') {
    showPopup();
    sendResponse({ success: true });
  }
  return true;
});

function startChecking() {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(() => {
    if (!isPopupVisible()) showPopup();
  }, CHECK_INTERVAL);
}
  
function init() {
  setTimeout(() => {
    showPopup();
    startChecking();
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function parseQuestionStatement(statement) {
  try {
    const trimmed = (statement || '').trim();
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
      return { statement: trimmed || statement || '', options: [] };
    }
    const parsed = JSON.parse(trimmed);
    const data = Array.isArray(parsed) ? parsed[0] : parsed;
    return {
      statement: data?.statement || statement || '',
      options: Array.isArray(data?.options) ? data.options : [],
    };
  } catch {
    return { statement: statement || '', options: [] };
  }
}

async function fetchQuestion() {
  try {
    const response = await fetch(`${API_BASE_URL}/webhook/question-spr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: FIXED_USER_ID }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        message: errorText || 'Failed to fetch question',
        data: null,
      };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        statusCode: response.status,
        message: 'Invalid response format',
        data: null,
      };
    }
    
    const data = await response.json();
    return { statusCode: response.status, ...data };
  } catch (error) {
    return {
      statusCode: 500,
      message: error.message || 'Failed to fetch question',
      data: null,
    };
  }
}

function renderQuestion(question) {
  if (!question) return '<p class="question-text">No question available</p>';

  const parsed = parseQuestionStatement(question.statement);
  const questionType = question.type;
  let html = `<p class="question-text">${parsed.statement || 'Question'}</p>`;

  if (questionType === 'single_choice' || questionType === 'multiple_choice') {
    const inputType = questionType === 'single_choice' ? 'radio' : 'checkbox';
    const nameAttr = questionType === 'single_choice' ? 'question-answer' : 'question-answer[]';
    html += '<div class="question-options">';
    parsed.options.forEach((option, index) => {
      const optionName = option.name || String.fromCharCode(65 + index);
      html += `
        <label class="option">
          <input type="${inputType}" name="${nameAttr}" value="${optionName}">
          <span>${optionName}. ${option.text || ''}</span>
        </label>
      `;
    });
    html += '</div>';
  } else if (questionType === 'true_false') {
    html += `
      <div class="question-options">
        <label class="option"><input type="radio" name="question-answer" value="True"><span>True</span></label>
        <label class="option"><input type="radio" name="question-answer" value="False"><span>False</span></label>
      </div>
    `;
  } else if (questionType === 'fill_in_the_blank' || questionType === 'short_answer') {
    html += `
      <div class="question-text-input">
        <textarea id="question-text-answer" class="text-answer" placeholder="Enter your answer..."></textarea>
      </div>
    `;
  }

  return html;
}

function isPopupVisible() {
  return popupElement && document.body.contains(popupElement);
}

function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}

function getAnswer(questionType) {
  if (questionType === 'single_choice' || questionType === 'true_false') {
    const selected = popupElement.querySelector('input[name="question-answer"]:checked');
    return selected?.value || '';
  }
  if (questionType === 'multiple_choice') {
    return Array.from(popupElement.querySelectorAll('input[name="question-answer[]"]:checked'))
      .map(input => input.value)
      .join(', ');
  }
  if (questionType === 'fill_in_the_blank' || questionType === 'short_answer') {
    return popupElement.querySelector('#question-text-answer')?.value.trim() || '';
  }
  return '';
}

async function submitAnswer(questionId, answer) {
  try {
    const response = await fetch(`${API_BASE_URL}/webhook/answer-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        answer,
        userId: FIXED_USER_ID,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to submit answer');
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid response format');
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    throw error;
  }
}

function renderResult(result) {
  let html = '<div class="result-section">';
  
  if (result.score !== null && result.score !== undefined) {
    html += `<div class="result-score">Score: ${result.score}%</div>`;
  }
  
  if (result.explain) {
    html += `<div class="result-explain"><strong>Explanation:</strong><p>${result.explain}</p></div>`;
  }
  
  if (result.aiFeedback) {
    html += `<div class="result-feedback"><strong>AI Feedback:</strong><p>${result.aiFeedback}</p></div>`;
  }
  
  html += '</div>';
  return html;
}

async function showPopup() {
  if (!document.body) {
    setTimeout(showPopup, 100);
    return;
  }
  
  if (isPopupVisible()) {
    return;
  }
  
  const questionData = await fetchQuestion();
  if (!questionData || (questionData.statusCode !== 200 && questionData.statusCode !== 201) || !questionData.data) {
    return;
  }
  
  const question = questionData.data;
  removePopup();
  
  popupElement = document.createElement('div');
  popupElement.id = 'hello-friend-popup';
  popupElement.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h2>Practice Question</h2>
        <button id="close-popup">×</button>
      </div>
      <div class="question-section">
        <div id="question-content" class="question-content"></div>
        <div id="result-content" class="result-content" style="display: none;"></div>
        <button id="submit-answer" class="submit-button">Submit Answer</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popupElement);
  
  const questionContent = popupElement.querySelector('#question-content');
  const resultContent = popupElement.querySelector('#result-content');
  const submitButton = popupElement.querySelector('#submit-answer');
  
  questionContent.innerHTML = renderQuestion(question);
  submitButton.setAttribute('data-question-id', question.id);
  submitButton.setAttribute('data-question-type', question.type);
  
  submitButton.addEventListener('click', async () => {
    const questionId = submitButton.getAttribute('data-question-id');
    const questionType = submitButton.getAttribute('data-question-type');
    const answer = getAnswer(questionType);
    
    if (!answer) {
      alert('Please provide an answer');
      return;
    }
    
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    
    try {
      const result = await submitAnswer(questionId, answer);
      resultContent.innerHTML = renderResult(result);
      resultContent.style.display = 'block';
      questionContent.style.display = 'none';
      submitButton.style.display = 'none';
    } catch (error) {
      alert('Failed to submit answer: ' + error.message);
      submitButton.textContent = 'Submit Answer';
      submitButton.disabled = false;
    }
  });
  
  popupElement.querySelector('#close-popup').addEventListener('click', removePopup);
}
