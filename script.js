var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var canvas = document.getElementById('pinkboard');
var ctx = canvas.getContext('2d');
var animationStarted = false;

// COLOQUE AS LETRAS DA SUA MÚSICA AQUI COM OS SEGUNDOS EXATOS:
const lyricsData = [
    { time: 0.5, text: "E se de repente" }, 
    { time: 3.8, text: "Fosse nossa ultima noite juntos..." }, 
    { time: 6.9, text: "e a medida" },
    { time: 8.5, text: "que a terra " },
    { time: 10.5, text: "vai desabando" },
    { time: 12.6, text: "Oh, garota é com " },
    { time: 15.2, text: "Você" },
    { time: 19.0, text: "que eu me deito" },
    { time: 23.0, text: "enquanto a bomba atomica vai caindo... " }, 
    { time: 26.6, text: "enquanto o mundo acaba..." },
    { time: 30.0, text: "o querida é com você" },
    { time: 34.0, text: "que eu assisto tv" },
    { time: 38.5, text: "enquanto o mundo..." },
    { time: 42.0, text: "enquanto o mundo...." },
    { time: 44.4, text: "acaba." },
];

// Variável de controle para a troca infinita de fotos de vocês
let fotoAtualIndex = 0;

var settings = {
    particles: {
        length:   isMobile ? 1500 : 2500, 
        duration:  isMobile ? 4.5 : 3.8,  
        velocity: isMobile ? 65 : 85,     
        effect: -1.0,
        size:      isMobile ? 24 : 36,    
    },
    colors: {
        core: 'rgba(255, 50, 100, 1)',
        glow: 'rgba(255, 255, 255, 1)'
    }
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Polyfill para suavidade do render
(function() {
    var b = 0; var c = ["ms", "moz", "webkit", "o"];
    for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
        window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(h, e) {
            var d = new Date().getTime(); var f = Math.max(0, 16 - (d - b));
            var g = window.setTimeout(function() { h(d + f); }, f); b = d + f; return g;
        };
    }
})();

var Point = function(x, y) {
    this.x = (typeof x !== 'undefined') ? x : 0;
    this.y = (typeof y !== 'undefined') ? y : 0;
};
Point.prototype.clone = function() { return new Point(this.x, this.y); };
Point.prototype.normalize = function() {
    var length = Math.sqrt(this.x * this.x + this.y * this.y);
    if (length > 0) { this.x /= length; this.y /= length; }
    return this;
};

var Particle = function() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
    this.sparkleDelay = Math.random() * 0.5;
};
Particle.prototype.initialize = function(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
};
Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
};
Particle.prototype.draw = function(context) {
    function ease(t) { return (--t) * t * t + 1; }
    var size = settings.particles.size * ease(this.age / settings.particles.duration);
    if (size <= 0) return;

    var opacity = 1 - this.age / settings.particles.duration;
    var sparkle = (Math.sin((this.age + this.sparkleDelay) * 10) + 1) / 2;
    
    context.save();
    context.globalAlpha = opacity * 0.8;
    
    var gradient = context.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, size / 2);
    if (sparkle > 0.5) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.2, 'rgba(255, 50, 100, 0.8)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 50, 100, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 50, 100, 0.4)');
    }
    gradient.addColorStop(1, 'rgba(255, 50, 100, 0)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.position.x, this.position.y, size / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
};

var ParticlePool = function(length) {
    var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
    
    this.add = function(x, y, dx, dy) {
        particles[firstFree].initialize(x, y, dx, dy);
        firstFree = (firstFree + 1) % particles.length;
        if (firstActive === firstFree) firstActive = (firstActive + 1) % particles.length;
    };
    this.update = function(deltaTime) {
        var i;
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) particles[i].update(deltaTime);
        } else {
            for (i = firstActive; i < particles.length; i++) particles[i].update(deltaTime);
            for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
        }
        while (particles[firstActive].age >= duration && firstActive !== firstFree) {
            firstActive = (firstActive + 1) % particles.length;
        }
    };
    this.draw = function(context) {
        var i;
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) particles[i].draw(context);
        } else {
            for (i = firstActive; i < particles.length; i++) particles[i].draw(context);
            for (i = 0; i < firstFree; i++) particles[i].draw(context);
        }
    };
};

var pool = new ParticlePool(settings.particles.length);
var particleRate = settings.particles.length / settings.particles.duration;
var time;

function pointOnHeart(t) {
    var scale = isMobile ? 0.95 : 1.35; 
    return new Point(
        scale * (160 * Math.pow(Math.sin(t), 3)),
        scale * (130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t))
    );
}

function render() {
    if (!animationStarted) return;
    requestAnimationFrame(render);

    var newTime = new Date().getTime() / 1000;
    var deltaTime = newTime - (time || newTime);
    time = newTime;

    if (deltaTime > 0.1) deltaTime = 0.1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
        var transformParam = Math.PI - 2 * Math.PI * Math.random();
        var pos = pointOnHeart(transformParam);
        var dir = pos.clone().normalize();
        var offsetY = isMobile ? -25 : -35;
        
        pool.add(
            canvas.width / 2 + pos.x, 
            canvas.height / 2 - pos.y + offsetY, 
            dir.x * settings.particles.velocity, 
            -dir.y * settings.particles.velocity
        );
    }

    pool.update(deltaTime);
    pool.draw(ctx);
}

function generateLyrics() {
    var wrapper = document.getElementById('lyrics-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    lyricsData.forEach(function(line, index) {
        var p = document.createElement('p');
        p.className = 'lyric-line';
        p.id = 'lyric-' + index;
        p.innerText = line.text;
        wrapper.appendChild(p);
    });
}
generateLyrics();

var loveSong = document.getElementById('love-song');

// ==========================================================================
// 1. SISTEMA DE SINCRONIA DAS LETRAS
// ==========================================================================
loveSong.addEventListener('timeupdate', function() {
    var currentTime = loveSong.currentTime;
    var activeIndex = -1;
    
    for (var i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }
    
    var allLines = document.querySelectorAll('.lyric-line');
    allLines.forEach(function(line, idx) {
        if (idx === activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
});

// ==========================================================================
// 2. EVENTO DE CLIQUE DO BOTÃO INICIAL (START)
// ==========================================================================
document.getElementById('start-btn').addEventListener('click', function() {
    var screen = document.getElementById('welcome-screen');
    var text = document.getElementById('namorados-text');
    var photo = document.getElementById('photo-center');
    var lyricsContainer = document.getElementById('lyrics-container');
    var musicBtn = document.getElementById('music-btn');
    
    loveSong.loop = false; // Segunda trava de segurança
    loveSong.play().catch(function(e) {
        console.log("Erro ao reproduzir o áudio:", e);
    });
    
    screen.style.opacity = '0';
    screen.style.visibility = 'hidden';
    
    setTimeout(function() {
        animationStarted = true;
        time = new Date().getTime() / 1000;
        render();
        
        if (text) text.style.opacity = '1';
        if (lyricsContainer) lyricsContainer.style.opacity = '1'; 
        
        if (musicBtn) {
            musicBtn.style.opacity = '1';
            musicBtn.style.pointerEvents = 'auto';
            musicBtn.classList.remove('music-paused');
            musicBtn.classList.add('music-playing');
        }
        
        if (photo) {
            photo.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(function() {
                photo.classList.add('pulse-active');
            }, 1000);
        }
    }, 250);
});

// ==========================================================================
// SISTEMA DE TROCA DE FOTOS (Range perfeito do formato do coração)
// ==========================================================================

function avancarGaleria() {
    const fotos = document.querySelectorAll('.foto-galeria');
    if (fotos.length > 1) {
        fotos[fotoAtualIndex].style.display = 'none';
        fotoAtualIndex = (fotoAtualIndex + 1) % fotos.length;
        fotos[fotoAtualIndex].style.display = 'block';
    }
}

// 1. Clique direto em cima da foto central
document.getElementById('photo-center').addEventListener('click', function(e) {
    e.stopPropagation(); 
    if (!animationStarted) return;
    avancarGaleria();
});

// 2. Clique no Canvas (pinkboard) - Ajustado para as laterais e embaixo do coração
document.getElementById('pinkboard').addEventListener('click', function(e) {
    if (!animationStarted) return;

    var clickX = e.clientX;
    var clickY = e.clientY;

    var centroX = window.innerWidth / 2;
    var centroY = window.innerHeight / 2;

    // AJUSTE DO RANGE: Deixamos a largura maior para pegar as bochechas do coração nas laterais
    var larguraLimite = isMobile ? 220 : 380; // Aumentado para cobrir os lados
    var alturaLimite = isMobile ? 180 : 280;  // Mantém a cobertura vertical (foto + ponta de baixo)

    // Verifica se o clique está dentro desse espaço retangular do coração
    if (Math.abs(clickX - centroX) < larguraLimite && Math.abs(clickY - centroY) < alturaLimite) {
        e.stopPropagation();
        avancarGaleria();
    }
});

// ==========================================================================
// 4. CONTROLE DO BOTÃO ÚNICO UNIFICADO (PLAY / PAUSE / REINICIAR)
// ==========================================================================
var musicBtn = document.getElementById('music-btn');
var musicBtnIcon = document.getElementById('music-btn-icon');

musicBtn.addEventListener('click', function(e) {
    e.stopPropagation(); 
    e.preventDefault();
    
    // CASO A: Se o ícone for a setinha, significa que acabou e o clique vai REINICIAR
    if (musicBtnIcon.innerText === '↻' || loveSong.ended) {
        
        // Força sumir com a mensagem de amor imediatamente ao reiniciar
        var loveMessage = document.getElementById('love-message');
        if (loveMessage) {
            loveMessage.style.display = 'none';
        }

        // Reseta os estilos CSS para o botão voltar ao local original (Topo Esquerdo)
        musicBtn.style.position = '';
        musicBtn.style.top = '';
        musicBtn.style.bottom = '';
        musicBtn.style.left = '';
        musicBtn.style.transform = '';
        musicBtn.style.zIndex = '';

        // Reconstrói as legendas apagadas antes de dar o play
        generateLyrics();

        loveSong.currentTime = 0;
        loveSong.play().catch(function(err){ console.log(err); });
        
        musicBtnIcon.innerText = '♫';
        musicBtn.classList.remove('music-paused');
        musicBtn.classList.add('music-playing');

        // Reseta as fotos rigidamente para a primeira
        fotoAtualIndex = 0; 
        const fotos = document.querySelectorAll('.foto-galeria');
        if (fotos.length > 0) {
            fotos.forEach(function(f, idx) {
                f.style.display = (idx === 0) ? 'block' : 'none';
            });
        }
        
        // Devolve o pulso para a foto
        var photo = document.getElementById('photo-center');
        if (photo) photo.classList.add('pulse-active');
        return; 
    }

    // CASO B: Comportamento normal durante a música (Play e Pause)
    if (loveSong.paused) {
        loveSong.play().catch(function(err){ console.log(err); });
        musicBtnIcon.innerText = '♫';
        musicBtn.classList.remove('music-paused');
        musicBtn.classList.add('music-playing');
    } else {
        loveSong.pause();
        musicBtnIcon.innerText = '║║';
        musicBtn.classList.remove('music-playing');
        musicBtn.classList.add('music-paused');
    }
});

// ==========================================================================
// EVENTO DE FIM DA MÚSICA (Apaga a legenda, move o botão e mostra a frase)
// ==========================================================================
loveSong.addEventListener('ended', function() {
    // 1. Apaga o texto da tela para sumir o "acaba" definitivamente
    var wrapper = document.getElementById('lyrics-wrapper');
    if (wrapper) {
        wrapper.innerHTML = ''; 
    }

    // 2. Garante que qualquer linha de texto residual suma da tela
    var activeLines = document.querySelectorAll('.lyric-line');
    activeLines.forEach(function(line) {
        line.classList.remove('active');
        line.style.opacity = '0';
        line.style.visibility = 'hidden';
    });

    // 3. Força o ícone do botão de música a virar a setinha de reiniciar (↻)
    var musicBtnIcon = document.getElementById('music-btn-icon');
    if (musicBtnIcon) {
        musicBtnIcon.innerText = '↻';
    }

    // 4. Move o botão dinamicamente para o lugar das legendas (Centralizado embaixo)
    var musicBtn = document.getElementById('music-btn');
    if (musicBtn) {
        musicBtn.classList.remove('music-playing');
        musicBtn.classList.add('music-paused');
        
        // Aplica o alinhamento fixado inferior para o botão
        musicBtn.style.position = 'fixed';
        musicBtn.style.top = 'auto';
        musicBtn.style.bottom = isMobile ? '80px' : '100px'; 
        musicBtn.style.left = '50%';
        musicBtn.style.transform = 'translateX(-50%)';
        musicBtn.style.zIndex = '99999';
    }

    // 5. ATIVAÇÃO FORÇADA: Exibe a mensagem de amor acima do botão modificado
    var loveMessage = document.getElementById('love-message');
    if (loveMessage) {
        loveMessage.style.setProperty('display', 'block', 'important');
        // Calcula a folga perfeita para ficar acima do botão dependendo da tela
        loveMessage.style.bottom = isMobile ? '150px' : '175px'; 
    }
    
    // 6. Para o pulso da foto central
    var photo = document.getElementById('photo-center');
    if (photo) {
        photo.classList.remove('pulse-active');
    }
});