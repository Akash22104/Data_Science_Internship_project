const input = document.getElementById('csv-input');
const uploadArea = document.getElementById('upload-area');
const APP_CONFIG = window.APP_CONFIG || {};
const API_BASE_URL = APP_CONFIG.API_BASE_URL || 'http://localhost:8000';
const ANALYZE_ENDPOINT = APP_CONFIG.ANALYZE_ENDPOINT || '/analyze';
const MAX_UPLOAD_SIZE_MB = APP_CONFIG.MAX_UPLOAD_SIZE_MB || 50;
const REQUEST_TIMEOUT_MS = APP_CONFIG.REQUEST_TIMEOUT_MS || 60000;

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ========== FILE UPLOAD VALIDATION ==========
function validateFile(file) {
  // Check if file is CSV
  if (!file.name.endsWith('.csv')) {
    showToast('❌ Please upload a CSV file', 'error');
    return false;
  }

  // Check file size (max 50MB)
  const maxSize = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxSize) {
    showToast(`❌ File too large! Max size is ${MAX_UPLOAD_SIZE_MB}MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error');
    return false;
  }

  return true;
}

input.addEventListener('change', () => {
  if (input.files[0]) {
    if (validateFile(input.files[0])) {
      uploadFile(input.files[0]);
    }
  }
});

uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--primary)';
  uploadArea.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
});

uploadArea.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--border)';
  uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--border)';
  uploadArea.style.backgroundColor = 'transparent';
  
  const file = e.dataTransfer.files[0];
  if (file && validateFile(file)) {
    uploadFile(file);
  }
});

// ========== FILE UPLOAD ==========
async function uploadFile(file) {
  document.getElementById('upload-area').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  showToast('📤 Uploading file...', 'info', 10000);

  const formData = new FormData();
  formData.append('file', file);

  // Capture upload time
  const uploadDateTime = new Date();
  const dateTimeString = uploadDateTime.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  window.fileInfo = {
    name: file.name,
    size: file.size,
    lastModified: dateTimeString,
    type: file.type
  };

  try {
    const res = await fetch(`${API_BASE_URL}${ANALYZE_ENDPOINT}`, {
      method: 'POST',
      body: formData,
      timeout: REQUEST_TIMEOUT_MS
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Validate response
    if (!data.profile || !data.ml_results) {
      throw new Error('Invalid response from backend - missing analysis data');
    }

    // Read and store the raw data for editing
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        window.rawData = parseCSV(e.target.result);
        if (window.rawData.data.length === 0) {
          throw new Error('CSV file is empty');
        }
        renderResults(data);
        showToast('✅ Analysis complete!', 'success');
      } catch (parseErr) {
        showToast(`❌ Error parsing CSV: ${parseErr.message}`, 'error');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('upload-area').classList.remove('hidden');
      }
    };
    reader.onerror = () => {
      showToast('❌ Error reading file', 'error');
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('upload-area').classList.remove('hidden');
    };
    reader.readAsText(file);
  } catch (err) {
    console.error('Upload error:', err);
    let errorMsg = 'Something went wrong. ';
    
    if (err.message.includes('Backend error')) {
      errorMsg += 'Backend server error - check console';
    } else if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED')) {
      errorMsg += `Is the backend running on ${API_BASE_URL}?`;
    } else {
      errorMsg += err.message;
    }
    
    showToast(`❌ ${errorMsg}`, 'error', 5000);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('upload-area').classList.remove('hidden');
  }
}

// ========== CSV PARSING ==========
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headers = lines[0].split(',').map(h => h.trim()).filter(h => h);
  
  if (headers.length === 0) {
    throw new Error('No columns found in CSV');
  }

  const data = lines.slice(1).map((line, lineNum) => {
    if (!line.trim()) return null; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => row !== null);

  return { headers, data };
}

function renderResults({ profile, ml_results, insights }) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');

  // Display dataset info
  const fileInfo = window.fileInfo;
  const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
  const dataTypes = profile.columns.filter(c => c.type === 'numeric').length;
  const categoryTypes = profile.columns.filter(c => c.type === 'categorical').length;
  
  const datasetInfoHTML = `
    <div class="dataset-info-header">
      <h3>📁 Dataset Information</h3>
    </div>
    <div class="dataset-info-grid">
      <div class="info-card">
        <div class="info-label">📄 Filename</div>
        <div class="info-value">${fileInfo.name}</div>
      </div>
      <div class="info-card">
        <div class="info-label">💾 File Size</div>
        <div class="info-value">${fileSizeMB} MB</div>
      </div>
      <div class="info-card">
        <div class="info-label">📅 Upload Time</div>
        <div class="info-value">${fileInfo.lastModified}</div>
      </div>
      <div class="info-card">
        <div class="info-label">📊 Rows</div>
        <div class="info-value">${profile.shape.rows.toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="info-label">📋 Columns</div>
        <div class="info-value">${profile.shape.columns}</div>
      </div>
      <div class="info-card">
        <div class="info-label">🔢 Numeric Columns</div>
        <div class="info-value">${dataTypes}</div>
      </div>
      <div class="info-card">
        <div class="info-label">📝 Categorical Columns</div>
        <div class="info-value">${categoryTypes}</div>
      </div>
      <div class="info-card">
        <div class="info-label">⚠️ Missing Values</div>
        <div class="info-value">${profile.missing_summary.percent_missing}%</div>
      </div>
      <div class="info-card">
        <div class="info-label">🔄 Duplicate Rows</div>
        <div class="info-value">${profile.duplicates}</div>
      </div>
    </div>
  `;

  // Insert dataset info before other sections
  const resultsContainer = document.querySelector('.results-container');
  const infoSection = document.createElement('section');
  infoSection.id = 'info-section';
  infoSection.innerHTML = datasetInfoHTML;
  resultsContainer.insertBefore(infoSection, resultsContainer.firstChild);

  // Add editable data table
  const dataEditorHTML = `
    <h2>📊 Dataset Preview (Editable)</h2>
    <p class="section-hint">All ${window.rawData.data.length} rows are editable. Click cells to edit.</p>
    <div class="data-table-wrapper">
      <table class="data-editor-table">
        <thead>
          <tr>
            <th>#</th>
            ${window.rawData.headers.map(h => `
              <th class="sortable-header" onclick="sortTable('${h}')" data-column="${h}">
                ${h}
                <span class="sort-indicator" data-column="${h}"></span>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${window.rawData.data.map((row, idx) => `
            <tr>
              <td class="row-number">${idx + 1}</td>
              ${window.rawData.headers.map(header => `
                <td class="editable-cell" data-row="${idx}" data-col="${header}">
                  ${row[header] || ''}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  const dataEditorSection = document.querySelector('#data-editor-section');
  if (dataEditorSection) {
    dataEditorSection.innerHTML = dataEditorHTML;
  }

  // Overview stats
  document.getElementById('overview-section').innerHTML = `
    <h2>Dataset Overview</h2>
    <div class="stat-grid">
      <div class="stat-card"><div class="value">${profile.shape.rows.toLocaleString()}</div><div class="label">Rows</div></div>
      <div class="stat-card"><div class="value">${profile.shape.columns}</div><div class="label">Columns</div></div>
      <div class="stat-card"><div class="value">${profile.missing_summary.percent_missing}%</div><div class="label">Missing values</div></div>
      <div class="stat-card"><div class="value">${profile.duplicates}</div><div class="label">Duplicate rows</div></div>
    </div>
  `;

  // Column profile table
  const rows = profile.columns.map(col => `
    <tr>
      <td>${col.name}</td>
      <td><span class="badge badge-${col.type}">${col.type}</span></td>
      <td>${col.missing_pct}%</td>
      <td>${col.unique}</td>
      <td>${col.type === 'numeric' ? col.mean : Object.keys(col.top_values)[0]}</td>
    </tr>
  `).join('');

  document.getElementById('profile-section').innerHTML = `
    <h2>Column profile</h2>
    <table>
      <thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th><th>Mean / Top value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // ML results
  if (!ml_results.error) {
    const features = Object.entries(ml_results.top_features)
      .map(([k, v]) => `<tr><td>${k}</td><td>${(v * 100).toFixed(1)}%</td></tr>`).join('');
    const metrics = Object.entries(ml_results.metrics)
      .map(([k, v]) => `<div class="stat-card"><div class="value">${v}</div><div class="label">${k}</div></div>`).join('');

    document.getElementById('ml-section').innerHTML = `
      <h2>ML results — ${ml_results.task} on "${ml_results.target_column}"</h2>
      <div class="stat-grid" style="margin-bottom:1rem">${metrics}</div>
      <table>
        <thead><tr><th>Feature</th><th>Importance</th></tr></thead>
        <tbody>${features}</tbody>
      </table>
    `;
  }

  // Generate interactive charts based on data
  generateInteractiveCharts();

  // Generate chart suggestions based on columns
  generateChartSuggestions(profile);
}

// ========== INTERACTIVE CHARTS WITH PLOTLY ==========
function generateInteractiveCharts() {
  try {
    const numCols = window.rawData.headers.filter(header => {
      const values = window.rawData.data.map(row => row[header]);
      return values.some(v => !isNaN(v) && v !== '');
    });

    const chartsContainer = document.querySelector('#charts-section');
    if (!chartsContainer) return;

    chartsContainer.innerHTML = '<h2>📊 Interactive Visualizations</h2><div id="charts-grid" class="charts-grid"></div>';
    const chartsGrid = document.getElementById('charts-grid');

    // Generate histograms for numeric columns
    numCols.slice(0, 2).forEach(col => {
      const values = window.rawData.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-container';
        chartDiv.id = `chart-${col}`;
        chartsGrid.appendChild(chartDiv);

        const trace = {
          x: values,
          type: 'histogram',
          nbinsx: 20,
          marker: { color: 'rgba(14, 165, 233, 0.7)' }
        };

        const layout = {
          title: `Distribution of ${col}`,
          xaxis: { title: col },
          yaxis: { title: 'Frequency' },
          margin: { l: 50, r: 30, t: 40, b: 40 },
          height: 350
        };

        Plotly.newPlot(`chart-${col}`, [trace], layout, { responsive: true });
      }
    });

    // Generate scatter plot if we have 2+ numeric columns
    if (numCols.length >= 2) {
      const chartDiv = document.createElement('div');
      chartDiv.className = 'chart-container';
      chartDiv.id = 'chart-scatter';
      chartsGrid.appendChild(chartDiv);

      const col1 = numCols[0];
      const col2 = numCols[1];
      const x = window.rawData.data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
      const y = window.rawData.data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));

      const trace = {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        marker: {
          size: 6,
          color: 'rgba(249, 115, 22, 0.6)',
          line: { width: 1, color: 'rgba(249, 115, 22, 1)' }
        }
      };

      const layout = {
        title: `${col1} vs ${col2}`,
        xaxis: { title: col1 },
        yaxis: { title: col2 },
        margin: { l: 50, r: 30, t: 40, b: 40 },
        height: 350
      };

      Plotly.newPlot('chart-scatter', [trace], layout, { responsive: true });
    }

    // Generate correlation heatmap for numeric columns
    if (numCols.length >= 2) {
      const chartDiv = document.createElement('div');
      chartDiv.className = 'chart-container';
      chartDiv.id = 'chart-heatmap';
      chartsGrid.appendChild(chartDiv);

      const correlationMatrix = calculateCorrelationMatrix(numCols);

      const trace = {
        z: correlationMatrix,
        x: numCols,
        y: numCols,
        type: 'heatmap',
        colorscale: 'Viridis',
        hovertemplate: '%{y} vs %{x}: %{z:.2f}<extra></extra>'
      };

      const layout = {
        title: 'Correlation Matrix',
        margin: { l: 100, r: 50, t: 40, b: 100 },
        height: 400,
        xaxis: { side: 'bottom' }
      };

      Plotly.newPlot('chart-heatmap', [trace], layout, { responsive: true });
    }

    showToast('✅ Visualizations generated!', 'success', 2000);
  } catch (err) {
    console.error('Chart generation error:', err);
    showToast(`⚠️ Could not generate charts: ${err.message}`, 'info');
  }
}

function calculateCorrelationMatrix(columns) {
  const n = columns.length;
  const matrix = Array(n).fill().map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const col1 = columns[i];
        const col2 = columns[j];
        const vals1 = window.rawData.data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
        const vals2 = window.rawData.data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));

        if (vals1.length > 0 && vals2.length > 0) {
          const mean1 = vals1.reduce((a, b) => a + b) / vals1.length;
          const mean2 = vals2.reduce((a, b) => a + b) / vals2.length;
          const std1 = Math.sqrt(vals1.reduce((a, v) => a + Math.pow(v - mean1, 2), 0) / vals1.length);
          const std2 = Math.sqrt(vals2.reduce((a, v) => a + Math.pow(v - mean2, 2), 0) / vals2.length);

          if (std1 > 0 && std2 > 0) {
            const cov = vals1.reduce((a, v, idx) => a + (v - mean1) * (vals2[idx] - mean2), 0) / vals1.length;
            matrix[i][j] = cov / (std1 * std2);
          }
        }
      }
    }
  }

  return matrix;
}

function generateChartSuggestions(profile) {
  const charts = [];
  const numCols = profile.columns.filter(c => c.type === 'numeric');
  const catCols = profile.columns.filter(c => c.type === 'categorical');

  // Suggest histograms for numeric columns
  numCols.slice(0, 2).forEach((col, idx) => {
    charts.push({
      title: `Distribution of ${col.name}`,
      type: 'histogram',
      description: 'Shows the frequency distribution of values',
      icon: '📊',
      code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('data.csv')

plt.figure(figsize=(10, 5))
plt.hist(df['${col.name}'], bins=30, color='#6c63ff', edgecolor='black')
plt.xlabel('${col.name}')
plt.ylabel('Frequency')
plt.title('Distribution of ${col.name}')
plt.grid(axis='y', alpha=0.3)
plt.show()`
    });
  });

  // Suggest bar charts for categorical columns
  catCols.slice(0, 2).forEach((col, idx) => {
    charts.push({
      title: `${col.name} Distribution`,
      type: 'bar',
      description: 'Compares frequencies across categories',
      icon: '📈',
      code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('data.csv')

value_counts = df['${col.name}'].value_counts()
plt.figure(figsize=(10, 5))
plt.bar(value_counts.index, value_counts.values, color='#6c63ff', edgecolor='black')
plt.xlabel('${col.name}')
plt.ylabel('Count')
plt.title('${col.name} Distribution')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`
    });
  });

  // Suggest scatter plot if we have 2+ numeric columns
  if (numCols.length >= 2) {
    charts.push({
      title: `${numCols[0].name} vs ${numCols[1].name}`,
      type: 'scatter',
      description: 'Shows relationship between two numeric variables',
      icon: '🔵',
      code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('data.csv')

plt.figure(figsize=(10, 5))
plt.scatter(df['${numCols[0].name}'], df['${numCols[1].name}'], 
           alpha=0.6, color='#6c63ff', s=100, edgecolors='black')
plt.xlabel('${numCols[0].name}')
plt.ylabel('${numCols[1].name}')
plt.title('${numCols[0].name} vs ${numCols[1].name}')
plt.grid(alpha=0.3)
plt.show()`
    });
  }

  // Suggest correlation heatmap if we have 3+ numeric columns
  if (numCols.length >= 3) {
    charts.push({
      title: 'Correlation Matrix',
      type: 'heatmap',
      description: 'Shows correlations between all numeric columns',
      icon: '🔥',
      code: `import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

df = pd.read_csv('data.csv')

plt.figure(figsize=(10, 8))
correlation_matrix = df.select_dtypes(include=['number']).corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', 
           center=0, square=True, linewidths=1)
plt.title('Correlation Matrix')
plt.tight_layout()
plt.show()`
    });
  }

  if (charts.length > 0) {
    const chartCards = charts.map((chart, idx) => `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-icon">${chart.icon}</span>
          <div>
            <h3>${chart.title}</h3>
            <span class="chart-type">${chart.type}</span>
          </div>
        </div>
        <p>${chart.description}</p>
      </div>
    `).join('');

    document.getElementById('charts-section').innerHTML = `
      <h2>Suggested Visualizations</h2>
      <p class="section-hint">Recommended charts based on your dataset</p>
      <div class="charts-grid">
        ${chartCards}
      </div>
    `;
  }
}

let isEditMode = false;

function toggleEditMode() {
  isEditMode = !isEditMode;
  
  if (isEditMode) {
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('download-btn').style.display = 'inline-block';
    document.getElementById('cancel-btn').style.display = 'inline-block';
    document.getElementById('columns-btn').style.display = 'none';
    
    // Make cells editable
    document.querySelectorAll('.editable-cell').forEach(cell => {
      cell.addEventListener('click', editCell);
    });
    
    document.getElementById('results').classList.add('edit-mode');
  } else {
    cancelEditMode();
  }
}

function editCell(e) {
  const cell = e.target;
  if (cell.querySelector('input')) return;
  
  const text = cell.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell-input';
  input.value = text;
  
  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();
  
  function saveCell() {
    const newValue = input.value;
    const row = parseInt(cell.dataset.row);
    const col = cell.dataset.col;
    
    // Update in-memory data
    window.rawData.data[row][col] = newValue;
    cell.textContent = newValue;
  }
  
  input.addEventListener('blur', saveCell);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveCell();
    } else if (e.key === 'Escape') {
      cell.textContent = text;
    }
  });
}

function cancelEditMode() {
  isEditMode = false;
  document.getElementById('edit-btn').style.display = 'inline-block';
  document.getElementById('download-btn').style.display = 'none';
  document.getElementById('cancel-btn').style.display = 'none';
  document.getElementById('columns-btn').style.display = 'inline-block';
  
  // Remove edit listeners
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.removeEventListener('click', editCell);
    const input = cell.querySelector('input');
    if (input) {
      cell.textContent = input.value;
    }
  });
  
  document.getElementById('results').classList.remove('edit-mode');
}

function downloadModifiedData() {
  // Confirm before download
  if (!confirm('📥 Download modified dataset as CSV?\n\nThis will download all changes you made.')) {
    return;
  }

  try {
    // Export modified data
    const headers = window.rawData.headers;
    let csv = headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\n';
    
    window.rawData.data.forEach(row => {
      const rowValues = headers.map(header => {
        const value = row[header] || '';
        return '"' + value.toString().replace(/"/g, '""') + '"';
      });
      csv += rowValues.join(',') + '\n';
    });
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${window.fileInfo.name.replace('.csv', '')}_modified.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    cancelEditMode();
    showToast('✅ Downloaded successfully!', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast(`❌ Download failed: ${err.message}`, 'error');
  }
}

// ========== COLUMN MANAGEMENT ==========
function openColumnManager() {
  const modal = document.getElementById('column-modal');
  const columnList = document.getElementById('column-list');
  
  // Initialize column metadata if not exists
  if (!window.columnMetadata) {
    window.columnMetadata = {};
    window.rawData.headers.forEach(h => {
      window.columnMetadata[h] = { name: h, type: 'text' };
    });
  }
  
  // Generate column management UI
  const columnItems = window.rawData.headers.map((header, idx) => `
    <div class="column-item">
      <div class="column-fields">
        <div class="field-group">
          <label>Column Name</label>
          <input type="text" class="column-name-input" value="${header}" data-original="${header}">
        </div>
        <div class="field-group">
          <label>Type</label>
          <select class="column-type-select" data-column="${header}">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
  
  columnList.innerHTML = columnItems;
  modal.classList.remove('hidden');
}

function closeColumnManager() {
  document.getElementById('column-modal').classList.add('hidden');
}

function applyColumnChanges() {
  const columnInputs = document.querySelectorAll('.column-name-input');
  const nameMap = {};
  const renamedCount = [0];
  
  columnInputs.forEach(input => {
    const oldName = input.dataset.original;
    const newName = input.value.trim();
    
    if (newName && newName !== oldName) {
      // Check for duplicates
      if (Object.values(nameMap).includes(newName)) {
        showToast(`❌ Duplicate column name: "${newName}"`, 'error');
        return;
      }
      nameMap[oldName] = newName;
      renamedCount[0]++;
    }
  });

  if (renamedCount[0] === 0) {
    showToast('ℹ️ No changes to apply', 'info');
    return;
  }

  // Confirm before applying
  if (!confirm(`⚙️ Rename ${renamedCount[0]} column(s)?\n\nThis will refresh the page.`)) {
    return;
  }

  try {
    // Apply column renames to rawData
    if (Object.keys(nameMap).length > 0) {
      // Rename headers
      window.rawData.headers = window.rawData.headers.map(h => nameMap[h] || h);
      
      // Rename keys in data
      window.rawData.data.forEach(row => {
        Object.keys(nameMap).forEach(oldName => {
          if (row.hasOwnProperty(oldName)) {
            row[nameMap[oldName]] = row[oldName];
            delete row[oldName];
          }
        });
      });
    }

    closeColumnManager();
    showToast('✅ Columns renamed! Refreshing...', 'success', 2000);
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    console.error('Column rename error:', err);
    showToast(`❌ Error renaming columns: ${err.message}`, 'error');
  }
}

// ========== SORTING ==========
let currentSort = { column: null, ascending: true };

function sortTable(column) {
  // Toggle sort direction if same column clicked
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }
  
  // Sort data
  const sorted = [...window.rawData.data].sort((a, b) => {
    let valA = a[column] || '';
    let valB = b[column] || '';
    
    // Try numeric sort if both look like numbers
    if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }
    
    if (valA < valB) return currentSort.ascending ? -1 : 1;
    if (valA > valB) return currentSort.ascending ? 1 : -1;
    return 0;
  });
  
  // Update sort indicators
  document.querySelectorAll('.sort-indicator').forEach(ind => {
    ind.textContent = '';
  });
  const indicator = document.querySelector(`.sort-indicator[data-column="${column}"]`);
  if (indicator) {
    indicator.textContent = currentSort.ascending ? ' ▲' : ' ▼';
  }
  
  // Render sorted data - update table body directly
  const tbody = document.querySelector('.data-editor-table tbody');
  if (tbody) {
    tbody.innerHTML = sorted.map((row, idx) => `
      <tr>
        <td class="row-number">${idx + 1}</td>
        ${window.rawData.headers.map(header => `
          <td class="editable-cell" data-row="${idx}" data-col="${header}">
            ${row[header] || ''}
          </td>
        `).join('')}
      </tr>
    `).join('');
  }
}