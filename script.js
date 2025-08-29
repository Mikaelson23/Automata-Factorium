let cy;
let cadeiaGlobal = "";
let estadosGlobal = [];
let transicoesGlobal = [];

function abrirModal(html) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  body.innerHTML = html;
  modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}


function simular() {
  const estadosInput = document.getElementById("estados").value.trim().split("\n");
  const transicoesInput = document.getElementById("transicoes").value.trim().split("\n");
  const cadeia = document.getElementById("cadeia").value.trim();

  const estados = estadosInput.map(l => {
    const [nome, inicial, finalizado] = l.split(",");
    return {
      nome: nome.trim(),
      isInitial: inicial && inicial.trim().toLowerCase() === "true",
      isFinal: finalizado && finalizado.trim().toLowerCase() === "true"
    };
  });

  const transicoes = transicoesInput.map(l => {
    const [origem, simbolo, destino] = l.split(",");
    return {
      origem: origem.trim(),
      simbolo: simbolo.trim(),
      destino: destino.trim()
    };
  });

  cadeiaGlobal = cadeia;
  estadosGlobal = estados;
  transicoesGlobal = transicoes;

  const iniciais = estados.filter(e => e.isInitial);
  if (iniciais.length === 0) {
    alert("Nenhum estado inicial foi definido. Marque um estado com 'true' na segunda coluna.");
    return;
  }
  if (iniciais.length > 1) {
    alert("Mais de um estado inicial foi definido. Autômatos determinísticos só podem ter um estado inicial.");
    return;
  }

  for (const t of transicoes) {
    if (!estados.some(e => e.nome === t.origem)) {
      alert(`Erro: origem "${t.origem}" não existe nos estados.`);
      return;
    }
    if (!estados.some(e => e.nome === t.destino)) {
      alert(`Erro: destino "${t.destino}" não existe nos estados.`);
      return;
    }
  }

  const alfabeto = new Set(transicoes.map(t => t.simbolo));
  for (const simbolo of cadeia) {
    if (!alfabeto.has(simbolo)) {
      alert(`Erro: símbolo "${simbolo}" não pertence ao alfabeto do autômato.`);
      return;
    }
  }

  if (cadeia.length === 0) {
    const estadoInicial = iniciais[0];
    if (estadoInicial.isFinal) {
      alert("Cadeia vazia aceita✔\nPois o estado inicial tambem é final");
    } else {
      alert("Cadeia vazia rejeitada ✖");
    }
    return;
  }

  const visitados = new Set([iniciais[0].nome]);
  const fila = [iniciais[0].nome];
  while (fila.length > 0) {
    const atual = fila.shift();
    for (const t of transicoes.filter(tr => tr.origem === atual)) {
      if (!visitados.has(t.destino)) {
        visitados.add(t.destino);
        fila.push(t.destino);
      }
    }
  }
  const inatingiveis = estados.filter(e => !visitados.has(e.nome));

  abrirModalComGrafo(estados, transicoes, cadeia);

  setTimeout(() => {
    const resultadoEl = document.getElementById("resultadoSimulacao");
    if (inatingiveis.length > 0 && resultadoEl) {
      resultadoEl.innerHTML += `<br><span style='color:#ffaa00; text-shadow:0 0 8px #ffaa00;'>
        Aviso: estados inatingíveis → ${inatingiveis.map(e => e.nome).join(", ")}
      </span>`;
    }
  }, 200);
}


function abrirModalComGrafo(estados, transicoes, cadeia) {
  const modalHTML = `
    <div style="margin-bottom: 10px; display:flex; justify-content: space-between; align-items: center;">
      <div>
        <button id="startSimulation">Iniciar Simulação</button>
      </div>
    </div>

    <div id="cadeiaWrap" style="margin-top:8px;">
      <div id="cadeiaDisplay" class="cadeia-display"></div>
    </div>

    <div id="resultadoSimulacao" style="margin-top:10px; font-size:20px; font-weight:bold; text-align:center; min-height:28px;"></div>
    <div id="cy" style="width: 100%; height: 500px; border: 1px solid #ccc;"></div>
    <p></p>
  `;
  abrirModal(modalHTML);

  setTimeout(() => {
    desenharGrafo(estados, transicoes);
    atualizarCadeiaVisual(-1);
    document.getElementById("startSimulation").onclick = () => iniciarSimulacao();
  }, 100);
}

function atualizarCadeiaVisual(posicao) {
  const display = document.getElementById("cadeiaDisplay");
  if (!display) return;

  const chars = cadeiaGlobal.split("");
  const html = chars.map((c, i) => {
    if (posicao === i) {
      return `<span data-i="${i}" style="background:#ffff33;color:#000;padding:4px 8px;border-radius:4px;display:inline-block;">${c}</span>`;
    }
    return `<span data-i="${i}" style="color:#fff;margin:0 4px;display:inline-block;">${c}</span>`;
  }).join("");

  if (posicao === -1) {
    display.innerHTML = chars.map((c, i) =>
      `<span data-i="${i}" style="color:#fff;margin:0 4px;display:inline-block;">${c}</span>`
    ).join("");
    display.scrollLeft = 0;
    return;
  }

  display.innerHTML = html;

  const current = display.querySelector(`[data-i="${posicao}"]`);
  if (current) {
    const centerLeft = current.offsetLeft - (display.clientWidth / 2) + (current.clientWidth / 2);
    display.scrollTo({ left: Math.max(0, centerLeft), behavior: 'smooth' });
  }
}





function alternarVisualizacao() {
      const estados = document.getElementById("estados").value.trim().split("\n").map(l => {
        const [nome, inicial, finalizado] = l.split(",");
        return { nome, inicial: inicial === 'true', finalizado: finalizado === 'true' };
      });

      const transicoes = document.getElementById("transicoes").value.trim().split("\n").map(l => {
        const [origem, simbolo, destino] = l.split(",");
        return { origem, simbolo, destino };
      });

      let html = '<h2 style="text-align:center; color:#00796b;">Máquina de Turing</h2>';
      html += '<table><tr><th>Estado Atual</th><th>Símbolo Lido</th><th>Próximo Estado</th><th>Escrever</th><th>Movimento</th></tr>';

      transicoes.forEach(t => {
        html += `<tr>
          <td>${t.origem}</td>
          <td>${t.simbolo}</td>
          <td>${t.destino}</td>
          <td>${t.simbolo}</td>
          <td>→</td>
        </tr>`;
      });

      const simboloFim = "-";
      estados.forEach(e => {
        const destino = e.finalizado ? "q_aceito" : "q_rejeita";
        const escreve = e.finalizado ? "T" : "F";
        html += `<tr>
          <td>${e.nome}</td>
          <td>${simboloFim}</td>
          <td>${destino}</td>
          <td>${escreve}</td>
          <td>-</td>
        </tr>`;
      });

      html += '</table>';
      abrirModal(html);
    }


function desenharGrafo(estados, transicoes) {
  const elementos = [];

  elementos.push({
    data: { id: "start", label: "" },
    position: { x: 50, y: 200 },
    classes: "inicial"
  });

  estados.forEach((e, i) => {
    elementos.push({
      data: {
        id: e.nome,
        label: e.nome,
        isInitial: e.isInitial ? "true" : "false",
        isFinal: e.isFinal ? "true" : "false"
      },
      position: { x: 150 + i * 100, y: 200 }
    });

    if (e.isInitial) {
      elementos.push({
        data: { id: `start_${e.nome}`, source: "start", target: e.nome, label: "" }
      });
    }
  });

  transicoes.forEach(t => {
    elementos.push({
      data: {
        id: `${t.origem}_${t.simbolo}_${t.destino}`,
        source: t.origem,
        target: t.destino,
        label: t.simbolo
      }
    });
  });

  cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elementos,
    style: [
  {
    selector: 'node',
    style: {
      'background-color': '#001a33',
      'border-width': 2,
      'border-color': '#00e6ff',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-outline-color': '#ffffffff',
      'text-outline-width': 2,
      'color': '#00e6ff',
      'font-size': '14px',
      'width': '40px',
      'height': '40px',
      'transition-property': 'background-color, border-color',
      'transition-duration': '200ms'
    }
  },

  {
    selector: '.active-edge',
    style: {
      'line-color': '#ff6a00',
      'target-arrow-color': '#ff6a00',
      'width': 4,
      'line-style': 'dashed',
      'line-dash-pattern': [6, 3],
      'line-dash-offset': 0
    }
  },


  {
    selector: 'node[isFinal = "true"]',
    style: {
      'border-width': 4,
      'border-color': '#00ff99'
    }
  },

  
  {
    selector: 'node#start',
    style: {
      'shape': 'ellipse',
      'background-color': '#00e6ff',
      'width': '10px',
      'height': '10px',
      'label': ''
    }
  },


  {
  selector: 'edge',
  style: {
    'width'                  : 2,
    'line-color'             : '#00e6ff',
    'target-arrow-color'     : '#00e6ff',
    'target-arrow-shape'     : 'triangle',
    'curve-style'            : 'bezier',
    'label'                  : 'data(label)',
    'font-size'              : '14px',
    'color'                  : '#00e6ff',
    'text-background-color'  : '#000',
    'text-background-opacity': 0.85,
    'text-background-padding': 4,   
    'text-border-opacity'    : 1,
    'text-border-width'      : 1,
    'text-border-color'      : '#00e6ff'
  }
},


{
  selector: '.highlighted',
  style: {
    'background-color'    : '#1e90ff',  
    'border-color'        : '#1e90ff',
    'color'               : '#fff',    
    'text-outline-color'  : '#000',    
    'text-outline-width'  : 2,
    'transition-property' : 'background-color, border-color, color',
    'transition-duration' : '200ms'
  }
}
],

    layout: {
      name: "preset"
    }
  });
}

function iniciarSimulacao() {
  if (!cy || cadeiaGlobal === undefined) return;

  const resultadoEl = document.getElementById("resultadoSimulacao");
  const setResultado = (html) => { if (resultadoEl) resultadoEl.innerHTML = html; };

  setResultado("");

  let estadoAtual = estadosGlobal.find(e => e.isInitial)?.nome;
  if (!estadoAtual) {
    setResultado("<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Nenhum estado inicial definido.</span>");
    return;
  }

if (cadeiaGlobal.length === 0) {
  const final = estadosGlobal.find(e => e.nome === estadoAtual)?.isFinal;
  if (final) {
    setResultado("<span style='color:#00ff99; text-shadow:0 0 8px #00ff99;'>Cadeia vazia aceita ✔</span>");
  } else {
    setResultado("<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Cadeia vazia rejeitada ✖</span>");
  }
  return; 
}

  let i = 0;
  let edgeAnterior = null;

  atualizarCadeiaVisual(0);

  function passo() {
    atualizarCadeiaVisual(i);

    cy.nodes().removeClass('highlighted');
    if (edgeAnterior && !edgeAnterior.empty()) edgeAnterior.removeClass('active-edge');

    const estadoNode = cy.getElementById(estadoAtual);
    if (!estadoNode || estadoNode.empty()) {
      setResultado(`<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Erro: nó "${estadoAtual}" não encontrado no grafo.</span>`);
      return;
    }
    estadoNode.addClass('highlighted');

    estadoNode.addClass('pulse');
    setTimeout(() => estadoNode.removeClass('pulse'), 220);

    const simbolo = cadeiaGlobal[i];
    const transicao = transicoesGlobal.find(
      t => t.origem === estadoAtual && t.simbolo === simbolo
    );

    if (transicao) {
      if (!cy.getElementById(transicao.destino) || cy.getElementById(transicao.destino).empty()) {
        setResultado(`<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Erro: destino "${transicao.destino}" não existe.</span>`);
        return;
      }

      const edgeID = `${transicao.origem}_${transicao.simbolo}_${transicao.destino}`;
      const edgeAtual = cy.getElementById(edgeID);

      if (edgeAtual && !edgeAtual.empty()) {
        edgeAtual.addClass('active-edge');

        let offset = 0;
        const animInterval = setInterval(() => {
          offset = (offset + 6) % 1000;
          edgeAtual.style('line-dash-offset', offset);
        }, 80);

        setTimeout(() => clearInterval(animInterval), 400);

        edgeAnterior = edgeAtual;
      }

      estadoAtual = transicao.destino;
      i++;

      if (i < cadeiaGlobal.length) {
        setTimeout(passo, 800);
      } else {
        setTimeout(() => {
          cy.nodes().removeClass('highlighted');
          const lastNode = cy.getElementById(estadoAtual);
          if (!lastNode.empty()) lastNode.addClass('highlighted');

          atualizarCadeiaVisual(-1);

          const final = estadosGlobal.find(e => e.nome === estadoAtual)?.isFinal;
          setResultado(
            final
              ? "<span style='color:#00ff99; text-shadow:0 0 8px #00ff99;'>Cadeia aceita ✔</span>"
              : "<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Cadeia rejeitada ✖</span>"
          );
        }, 600);
      }
    } else {
      setResultado("<span style='color:#ff3333; text-shadow:0 0 8px #ff3333;'>Transição inválida ✖</span>");
      return;
    }
  }

  passo();
}


document.querySelectorAll("textarea").forEach((el) => {
  el.addEventListener("input", () => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
});

function validarEstados() {
  const estadosInput = document.getElementById("estados");
  const linhas = estadosInput.value.trim().split("\n").filter(l => l !== "");

  const valido = linhas.every(l => {
    const partes = l.split(",");
    if (partes.length !== 3) return false;
    const [nome, inicial, finalizado] = partes.map(p => p.trim().toLowerCase());
    return nome.length > 0 && (inicial === "true" || inicial === "false") && (finalizado === "true" || finalizado === "false");
  });

  estadosInput.classList.toggle("valid", valido);
  estadosInput.classList.toggle("invalid", !valido);

  return valido;
}

function validarTransicoes() {
  const transicoesInput = document.getElementById("transicoes");
  const linhas = transicoesInput.value.trim().split("\n").filter(l => l !== "");

  const valido = linhas.every(l => {
    const partes = l.split(",");
    if (partes.length !== 3) return false;
    return partes.every(p => p.trim().length > 0);
  });

  transicoesInput.classList.toggle("valid", valido);
  transicoesInput.classList.toggle("invalid", !valido);

  return valido;
}

function validarCadeia() {
  const cadeiaInput = document.getElementById("cadeia");
  const valor = cadeiaInput.value.trim();

  const valido = valor.length >= 0; 

  cadeiaInput.classList.toggle("valid", valido);
  cadeiaInput.classList.toggle("invalid", !valido);

  return valido;
}

window.onload = function() {
  const estadosInput = document.getElementById("estados");
  const transicoesInput = document.getElementById("transicoes");
  const cadeiaInput = document.getElementById("cadeia");
  const btnSimular = document.querySelector("button[onclick='simular()']");

  function validarTudo() {
    const okEstados = validarEstados();
    const okTransicoes = validarTransicoes();
    const okCadeia = validarCadeia();
    btnSimular.disabled = !(okEstados && okTransicoes && okCadeia);
  }

  estadosInput.addEventListener("input", validarTudo);
  transicoesInput.addEventListener("input", validarTudo);
  cadeiaInput.addEventListener("input", validarTudo);

  validarTudo(); 
};
