<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Copiar index.js Completo - GAC CEASA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #0B2417;
            color: #F3F1E8;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 15px;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #2DD4BF, #FCD34D);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(45, 212, 191, 0.3);
        }
        
        .header h1 {
            color: #0B2417;
            font-size: 22px;
            margin-bottom: 5px;
        }
        
        .header p {
            color: #0B2417;
            font-size: 13px;
            font-weight: 600;
        }
        
        .status-box {
            background: #1B4230;
            border-left: 4px solid #2DD4BF;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .status-box strong {
            color: #2DD4BF;
        }
        
        .alteracoes {
            background: #12301F;
            border: 1px solid #254A36;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 12px;
        }
        
        .alteracoes div {
            padding: 6px 0;
            border-bottom: 1px solid #254A36;
        }
        
        .alteracoes div:last-child {
            border-bottom: none;
        }
        
        .check {
            color: #2DD4BF;
            font-weight: bold;
        }
        
        .btn-copy {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #2DD4BF, #FCD34D);
            color: #0B2417;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 15px;
            transition: transform 0.2s;
        }
        
        .btn-copy:active {
            transform: scale(0.98);
        }
        
        .alert {
            background: #22C55E;
            color: #0B2417;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 15px;
            display: none;
            animation: slideDown 0.3s;
        }
        
        .alert.show {
            display: block;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .code-label {
            background: #254A36;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 11px;
            color: #2DD4BF;
            font-weight: 600;
        }
        
        .code-container {
            background: #081C11;
            border: 1px solid #254A36;
            border-radius: 6px;
            padding: 12px;
            max-height: 50vh;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 9px;
            line-height: 1.2;
            color: #2DD4BF;
            white-space: pre-wrap;
            word-break: break-all;
            user-select: all;
        }
        
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #254A36;
            text-align: center;
            font-size: 11px;
            color: #9FB8A9;
        }
        
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: #0B2417;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #2DD4BF;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 index.js COMPLETO</h1>
        <p>GAC CEASA - Com TODAS as 6 alterações prontas!</p>
    </div>
    
    <div class="alert" id="alert">✅ Copiado com sucesso!</div>
    
    <div class="status-box">
        <strong>✅ INCLUSAS AS 6 ALTERAÇÕES:</strong><br>
        <span class="check">✓</span> Filtro Data Requisição<br>
        <span class="check">✓</span> Filtro Data Folha Carga<br>
        <span class="check">✓</span> Campo Destino (Estoque/Cliente)<br>
        <span class="check">✓</span> Campo Cargueiro<br>
        <span class="check">✓</span> Desconto Fundo Rural<br>
        <span class="check">✓</span> Editar Vale Venda/Compra
    </div>
    
    <div class="alteracoes">
        <div><strong>📝 COMO USAR:</strong></div>
        <div>1️⃣ Clique em "COPIAR CÓDIGO" (verde)</div>
        <div>2️⃣ Abra GitHub → pages/index.js</div>
        <div>3️⃣ Clique em ✏️ (editar)</div>
        <div>4️⃣ Selecione tudo (Ctrl+A)</div>
        <div>5️⃣ Cole (Ctrl+V)</div>
        <div>6️⃣ Commit changes</div>
    </div>
    
    <button class="btn-copy" onclick="copiarCodigo()">📋 COPIAR CÓDIGO COMPLETO</button>
    
    <div class="code-label">Arquivo: index.js (3555 linhas - COMPLETO)</div>
    
    <div class="code-container" id="codigo">Carregando código...</div>
    
    <div class="footer">
        <strong>⚠️ Este arquivo tem TUDO pronto!</strong><br>
        Basta copiar e colar no GitHub.
    </div>

    <script>
        let codigoCompleto = '';
        
        async function carregarCodigo() {
            const codigoElemento = document.getElementById('codigo');
            try {
                // Tenta buscar o arquivo do servidor de forma limpa usando a API Fetch moderna
                const response = await fetch('/index.js');
                if (!response.ok) {
                    throw new Error('Arquivo index.js não foi encontrado no servidor.');
                }
                
                codigoCompleto = await response.text();
                codigoElemento.textContent = codigoCompleto;
            } catch (error) {
                console.error(error);
                codigoElemento.textContent = '⚠️ Erro ao carregar o código automaticamente. Certifique-se de que o arquivo index.js está na mesma pasta.';
            }
        }
        
        function copiarCodigo() {
            // Se a busca falhou ou ainda não aconteceu, não tenta copiar o texto de aviso
            if (!codigoCompleto || codigoCompleto.trim() === '' || codigoCompleto.startsWith('⚠️') || codigoCompleto === 'Carregando código...') {
                alert('❌ O código ainda não foi carregado do servidor ou não foi encontrado.');
                return;
            }
            
            // Clipboard API moderna
            navigator.clipboard.writeText(codigoCompleto)
                .then(() => {
                    mostrarSucesso();
                })
                .catch(() => {
                    // Fallback obrigatório para navegadores móveis (Android/Safari antigo)
                    const textArea = document.createElement('textarea');
                    textArea.value = codigoCompleto;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        document.execCommand('copy');
                        mostrarSucesso();
                    } catch (err) {
                        alert('❌ Erro ao copiar. Toque e segure na caixa de código abaixo para selecionar tudo manualmente.');
                    }
                    
                    document.body.removeChild(textArea);
                });
        }
        
        function mostrarSucesso() {
            const msgAlert = document.getElementById('alert');
            msgAlert.classList.add('show');
            setTimeout(() => {
                msgAlert.classList.remove('show');
            }, 3000);
        }
        
        // Dispara o carregamento assim que a página estiver pronta
        window.addEventListener('DOMContentLoaded', carregarCodigo);
    </script>
</body>
</html>
