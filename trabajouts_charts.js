// === FIGURA 1: Fuentes de agua (barras) ===
(function(){
    var c=document.getElementById('c1');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    var data=[
        {label:'Quebradas',val:42,color:'#e74c3c'},
        {label:'Acueducto\nveredal',val:28,color:'#f39c12'},
        {label:'Agua\nlluvia',val:18,color:'#3498db'},
        {label:'Carro-\ntanques',val:8,color:'#9b59b6'},
        {label:'Agua\nembotellada',val:4,color:'#2ecc71'}
    ];
    var mx=50,bW=70,gap=25,sX=60,bY=H-55;
    ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#2c3e50';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText('Fuentes de agua en veredas de Lebrija (%)',W/2,22);
    ctx.strokeStyle='#e0e0e0';ctx.lineWidth=.5;
    for(var i=0;i<=50;i+=10){
        var y=bY-(i/50)*(bY-40);
        ctx.beginPath();ctx.moveTo(sX-5,y);ctx.lineTo(W-15,y);ctx.stroke();
        ctx.fillStyle='#999';ctx.font='10px sans-serif';ctx.textAlign='right';
        ctx.fillText(i+'%',sX-9,y+3);
    }
    data.forEach(function(d,idx){
        var x=sX+idx*(bW+gap);
        var barH=(d.val/50)*(bY-40);
        var y=bY-barH;
        ctx.fillStyle=d.color;
        ctx.beginPath();ctx.moveTo(x,bY);ctx.lineTo(x,y+5);
        ctx.quadraticCurveTo(x,y,x+5,y);ctx.lineTo(x+bW-5,y);
        ctx.quadraticCurveTo(x+bW,y,x+bW,y+5);ctx.lineTo(x+bW,bY);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText(d.val+'%',x+bW/2,y+20);
        ctx.fillStyle='#333';ctx.font='9.5px sans-serif';
        d.label.split('\n').forEach(function(l,li){ctx.fillText(l,x+bW/2,bY+13+li*12);});
    });
})();

// === FIGURA 2: Arbol de problemas ===
(function(){
    var c=document.getElementById('c2');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.fillStyle='#fefefe';ctx.fillRect(0,0,W,H);
    function box(x,y,w,h,txt,bg,tc){
        ctx.fillStyle=bg;
        ctx.beginPath();ctx.moveTo(x+6,y);ctx.lineTo(x+w-6,y);
        ctx.quadraticCurveTo(x+w,y,x+w,y+6);ctx.lineTo(x+w,y+h-6);
        ctx.quadraticCurveTo(x+w,y+h,x+w-6,y+h);ctx.lineTo(x+6,y+h);
        ctx.quadraticCurveTo(x,y+h,x,y+h-6);ctx.lineTo(x,y+6);
        ctx.quadraticCurveTo(x,y,x+6,y);ctx.fill();
        ctx.fillStyle=tc||'#fff';ctx.font='10px sans-serif';ctx.textAlign='center';
        var ls=txt.split('\n');
        ls.forEach(function(l,i){ctx.fillText(l,x+w/2,y+h/2-(ls.length-1)*6+i*13);});
    }
    function arr(x1,y1,x2,y2){
        ctx.strokeStyle='#888';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        var a=Math.atan2(y2-y1,x2-x1);
        ctx.beginPath();ctx.moveTo(x2,y2);
        ctx.lineTo(x2-7*Math.cos(a-.35),y2-7*Math.sin(a-.35));
        ctx.lineTo(x2-7*Math.cos(a+.35),y2-7*Math.sin(a+.35));
        ctx.fillStyle='#888';ctx.fill();
    }
    // Labels
    ctx.fillStyle='#e74c3c';ctx.font='bold 12px sans-serif';ctx.textAlign='left';
    ctx.fillText('EFECTOS',8,22);
    ctx.fillStyle='#0077b6';ctx.fillText('PROBLEMA CENTRAL',8,210);
    ctx.fillStyle='#e67e22';ctx.fillText('CAUSAS',8,280);

    // Effects
    box(40,30,170,45,'Enfermedades diarreicas\n(EDA) en niños','#e74c3c');
    box(260,30,170,45,'Gastos medicos agravan\nla pobreza','#e74c3c');
    box(480,30,180,45,'Desercion escolar\npor enfermedad','#e74c3c');

    box(100,100,130,35,'Desnutricion infantil','#ff7675');
    box(430,100,140,35,'Baja productividad','#ff7675');

    // Central
    box(150,175,400,50,'FALTA DE ACCESO A AGUA POTABLE\nEN VEREDAS DE LEBRIJA','#0077b6');

    // Causes
    box(30,300,180,45,'Ausencia de\ninfraestructura','#f39c12','#333');
    box(260,300,170,45,'Recursos municipales\ninsuficientes','#f39c12','#333');
    box(480,300,185,45,'Terreno montañoso\ndificulta obras','#f39c12','#333');

    box(80,375,180,40,'Comunidades dispersas\ngeograficamente','#ffeaa7','#333');
    box(400,375,190,40,'No hay tecnologias de\nbajo costo apropiadas','#ffeaa7','#333');

    // Arrows up (causes -> problem)
    arr(120,300,250,225);arr(345,300,350,225);arr(570,300,450,225);
    arr(170,375,170,345);arr(495,375,495,345);

    // Arrows down (problem -> effects)
    arr(250,175,125,75);arr(350,175,345,75);arr(450,175,570,75);
    arr(165,100,165,75);arr(500,100,500,75);
})();

// === FIGURA 3: Design Thinking ===
(function(){
    var c=document.getElementById('c3');if(!c)return;
    var ctx=c.getContext('2d');
    ctx.fillStyle='#fafafa';ctx.fillRect(0,0,c.width,c.height);
    var ph=[
        {l:'Empatizar',c:'#e74c3c'},
        {l:'Definir',c:'#f39c12'},
        {l:'Idear',c:'#2ecc71'},
        {l:'Prototipar',c:'#3498db'},
        {l:'Testear',c:'#9b59b6'}
    ];
    var r=35,gap=130,sx=60,cy=75;
    ph.forEach(function(p,i){
        var cx=sx+i*gap;
        ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=p.c;ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
        ctx.fillText(p.l,cx,cy+4);
        if(i<4){
            ctx.strokeStyle='#aaa';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(cx+r+4,cy);ctx.lineTo(cx+gap-r-10,cy);ctx.stroke();
            ctx.beginPath();ctx.moveTo(cx+gap-r-6,cy);
            ctx.lineTo(cx+gap-r-14,cy-5);ctx.lineTo(cx+gap-r-14,cy+5);
            ctx.fillStyle='#aaa';ctx.fill();
        }
    });
    // Return arrow
    ctx.strokeStyle='#ccc';ctx.lineWidth=1;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(sx+4*gap,cy+r+5);
    ctx.quadraticCurveTo(sx+2*gap,cy+r+40,sx,cy+r+5);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#ccc';ctx.font='9px sans-serif';
    ctx.fillText('Iterativo',sx+2*gap,cy+r+35);
})();

// === FIGURA 4: SCAMPER ===
(function(){
    var c=document.getElementById('c4');if(!c)return;
    var ctx=c.getContext('2d');
    ctx.fillStyle='#fefefe';ctx.fillRect(0,0,c.width,c.height);
    var items=[
        {lt:'S',w:'Sustituir',cl:'#e74c3c',d:'Biofiltros\nlocales'},
        {lt:'C',w:'Combinar',cl:'#e67e22',d:'Filtro +\nUV solar'},
        {lt:'A',w:'Adaptar',cl:'#f1c40f',d:'SODIS a\ncomunidad'},
        {lt:'M',w:'Modificar',cl:'#2ecc71',d:'1 a 20\nfamilias'},
        {lt:'P',w:'Otros usos',cl:'#3498db',d:'Educacion\nescuelas'},
        {lt:'E',w:'Eliminar',cl:'#9b59b6',d:'Quimicos\nelectricidad'},
        {lt:'R',w:'Reordenar',cl:'#1abc9c',d:'Etapas\nmodulares'}
    ];
    ctx.fillStyle='#2c3e50';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText('Metodo SCAMPER',c.width/2,20);
    var bw=74,g=8,tw=items.length*(bw+g)-g,sx=(c.width-tw)/2;
    items.forEach(function(it,i){
        var x=sx+i*(bw+g),y=40;
        ctx.beginPath();ctx.arc(x+bw/2,y+24,20,0,Math.PI*2);
        ctx.fillStyle=it.cl;ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';
        ctx.fillText(it.lt,x+bw/2,y+30);
        ctx.fillStyle='#333';ctx.font='bold 8.5px sans-serif';
        ctx.fillText(it.w,x+bw/2,y+54);
        ctx.fillStyle='#555';ctx.font='8px sans-serif';
        it.d.split('\n').forEach(function(l,li){ctx.fillText(l,x+bw/2,y+68+li*11);});
    });
    // Result box
    var rx=c.width/2-170,ry=160;
    ctx.fillStyle='#0077b6';
    ctx.beginPath();ctx.moveTo(rx+6,ry);ctx.lineTo(rx+340-6,ry);
    ctx.quadraticCurveTo(rx+340,ry,rx+340,ry+6);ctx.lineTo(rx+340,ry+40-6);
    ctx.quadraticCurveTo(rx+340,ry+40,rx+340-6,ry+40);ctx.lineTo(rx+6,ry+40);
    ctx.quadraticCurveTo(rx,ry+40,rx,ry+40-6);ctx.lineTo(rx,ry+6);
    ctx.quadraticCurveTo(rx,ry,rx+6,ry);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';
    ctx.fillText('RESULTADO: Sistema Comunitario de Potabilizacion Solar',c.width/2,ry+24);
    ctx.strokeStyle='#0077b6';ctx.lineWidth=1;
    [0,3,6].forEach(function(i){
        var x=sx+i*(bw+g)+bw/2;
        ctx.beginPath();ctx.moveTo(x,130);ctx.lineTo(c.width/2,ry);ctx.stroke();
    });
})();

// === FIGURA 5: Oceano Azul curva de valor ===
(function(){
    var c=document.getElementById('c5');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.fillStyle='#fefefe';ctx.fillRect(0,0,W,H);
    var factors=['Costo','Complejidad','Dependencia\nquimica','Participacion\ncomunidad','Sostenibilidad','Escalabilidad','Autonomia\nlocal','Educacion'];
    var trad=[9,8,9,2,3,4,1,1];
    var innov=[3,3,1,9,9,8,9,8];
    var pL=45,pR=25,pT=42,pB=60,pW=W-pL-pR,pH=H-pT-pB;
    var step=pW/(factors.length-1);
    ctx.fillStyle='#2c3e50';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    ctx.fillText('Curva de Valor - Oceano Azul',W/2,18);
    ctx.strokeStyle='#eaeaea';ctx.lineWidth=.5;
    for(var i=0;i<=10;i+=2){
        var y=pT+pH-(i/10)*pH;
        ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();
        ctx.fillStyle='#999';ctx.font='9px sans-serif';ctx.textAlign='right';
        ctx.fillText(i,pL-6,y+3);
    }
    // Traditional
    ctx.beginPath();ctx.strokeStyle='#e74c3c';ctx.lineWidth=2.5;
    trad.forEach(function(v,i){var x=pL+i*step,y=pT+pH-(v/10)*pH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();
    trad.forEach(function(v,i){var x=pL+i*step,y=pT+pH-(v/10)*pH;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();});
    // Innovative
    ctx.beginPath();ctx.strokeStyle='#0077b6';ctx.lineWidth=2.5;
    innov.forEach(function(v,i){var x=pL+i*step,y=pT+pH-(v/10)*pH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();
    innov.forEach(function(v,i){var x=pL+i*step,y=pT+pH-(v/10)*pH;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fillStyle='#0077b6';ctx.fill();});
    // Labels
    ctx.fillStyle='#333';ctx.font='8.5px sans-serif';ctx.textAlign='center';
    factors.forEach(function(f,i){var x=pL+i*step;f.split('\n').forEach(function(l,li){ctx.fillText(l,x,pT+pH+14+li*10);});});
    // Legend
    ctx.fillStyle='#e74c3c';ctx.fillRect(W-210,30,12,3);
    ctx.fillStyle='#333';ctx.font='10px sans-serif';ctx.textAlign='left';
    ctx.fillText('Solucion tradicional',W-194,35);
    ctx.fillStyle='#0077b6';ctx.fillRect(W-210,44,12,3);
    ctx.fillStyle='#333';ctx.fillText('Propuesta SCPS',W-194,49);
})();

// === FIGURA 6: Diagrama del sistema ===
(function(){
    var c=document.getElementById('c6');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.fillStyle='#f0f7ff';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#2c3e50';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText('Sistema Comunitario de Potabilizacion Solar (SCPS)',W/2,22);
    function rr(x,y,w,h,bg){
        ctx.fillStyle=bg;ctx.beginPath();
        ctx.moveTo(x+6,y);ctx.lineTo(x+w-6,y);ctx.quadraticCurveTo(x+w,y,x+w,y+6);
        ctx.lineTo(x+w,y+h-6);ctx.quadraticCurveTo(x+w,y+h,x+w-6,y+h);
        ctx.lineTo(x+6,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-6);
        ctx.lineTo(x,y+6);ctx.quadraticCurveTo(x,y,x+6,y);ctx.fill();
    }
    function arw(x1,y1,x2,y2){
        ctx.strokeStyle='#0077b6';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-8,y2-5);ctx.lineTo(x2-8,y2+5);
        ctx.fillStyle='#0077b6';ctx.fill();
    }
    var cy=130;
    // Source
    rr(15,cy-40,100,80,'#74b9ff');
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    ctx.fillText('FUENTE',65,cy-8);ctx.font='9px sans-serif';
    ctx.fillText('Quebrada /',65,cy+6);ctx.fillText('Agua lluvia',65,cy+18);

    arw(115,cy,145,cy);

    // Stage 1
    rr(150,cy-40,120,80,'#fdcb6e');
    ctx.fillStyle='#333';ctx.font='bold 10px sans-serif';
    ctx.fillText('ETAPA 1',210,cy-14);ctx.font='9px sans-serif';
    ctx.fillText('Sedimentacion',210,cy);ctx.fillText('+ Prefiltrado',210,cy+12);
    ctx.font='8px sans-serif';ctx.fillStyle='#666';ctx.fillText('500L, 4-6 horas',210,cy+28);

    arw(270,cy,300,cy);

    // Stage 2
    rr(305,cy-40,120,80,'#a29bfe');
    ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';
    ctx.fillText('ETAPA 2',365,cy-14);ctx.font='9px sans-serif';
    ctx.fillText('Biofiltro',365,cy);ctx.fillText('Arena+Carbon',365,cy+12);
    ctx.font='8px sans-serif';ctx.fillStyle='#ddd';ctx.fillText('90-95% turbidez',365,cy+28);

    arw(425,cy,455,cy);

    // Stage 3
    rr(460,cy-40,130,80,'#55efc4');
    ctx.fillStyle='#333';ctx.font='bold 10px sans-serif';
    ctx.fillText('ETAPA 3',525,cy-14);ctx.font='9px sans-serif';
    ctx.fillText('UV Solar (SODIS)',525,cy);ctx.fillText('Botellas PET',525,cy+12);
    ctx.font='8px sans-serif';ctx.fillStyle='#555';ctx.fillText('99.9% patogenos',525,cy+28);

    arw(590,cy,620,cy);

    // Output
    rr(625,cy-25,30,50,'#00b894');
    ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';
    ctx.fillText('=',640,cy+6);

    // Sun icon
    ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(525,cy-60,16,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f39c12';ctx.lineWidth=2;
    for(var i=0;i<8;i++){
        var a=i*Math.PI/4;
        ctx.beginPath();ctx.moveTo(525+20*Math.cos(a),cy-60+20*Math.sin(a));
        ctx.lineTo(525+28*Math.cos(a),cy-60+28*Math.sin(a));ctx.stroke();
    }
    ctx.fillStyle='#f39c12';ctx.font='9px sans-serif';ctx.fillText('Energia solar',525,cy-85);

    // Bottom labels
    ctx.fillStyle='#0077b6';ctx.font='bold 12px sans-serif';
    ctx.fillText('AGUA POTABLE SEGURA',W/2,H-25);
    ctx.fillStyle='#27ae60';ctx.font='10px sans-serif';
    ctx.fillText('Sin quimicos | Sin electricidad | Operado por la comunidad',W/2,H-10);
})();

// === FIGURA 7: Comparativa de costos ===
(function(){
    var c=document.getElementById('c7');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);
    var data=[
        {label:'Planta\nconvencional',val:1500000,color:'#e74c3c'},
        {label:'Filtro\ncomercial',val:800000,color:'#f39c12'},
        {label:'Carrotanque\n(anual)',val:600000,color:'#9b59b6'},
        {label:'SCPS\n(propuesta)',val:38000,color:'#27ae60'}
    ];
    var mx=1500000,bW=90,gap=35,sX=70,bY=H-55;
    ctx.fillStyle='#2c3e50';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    ctx.fillText('Costo por familia (COP)',W/2,20);
    data.forEach(function(d,idx){
        var x=sX+idx*(bW+gap);
        var barH=Math.max((d.val/mx)*(bY-40),8);
        var y=bY-barH;
        ctx.fillStyle=d.color;
        ctx.beginPath();ctx.moveTo(x,bY);ctx.lineTo(x,y+4);
        ctx.quadraticCurveTo(x,y,x+4,y);ctx.lineTo(x+bW-4,y);
        ctx.quadraticCurveTo(x+bW,y,x+bW,y+4);ctx.lineTo(x+bW,bY);ctx.fill();
        ctx.fillStyle=d.val<100000?'#333':'#fff';
        ctx.font='bold 11px sans-serif';
        var txt=d.val>=1000000?'$'+((d.val/1000000).toFixed(1))+'M':'$'+(d.val/1000)+'k';
        ctx.fillText(txt,x+bW/2,d.val<100000?y-8:y+18);
        ctx.fillStyle='#333';ctx.font='9px sans-serif';
        d.label.split('\n').forEach(function(l,li){ctx.fillText(l,x+bW/2,bY+13+li*12);});
    });
    // Arrow showing savings
    ctx.strokeStyle='#27ae60';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(sX+bW/2,bY-(1500000/mx)*(bY-40)+20);
    ctx.lineTo(sX+3*(bW+gap)+bW/2,bY-8);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#27ae60';ctx.font='bold 10px sans-serif';
    ctx.fillText('97% ahorro',W/2+30,bY-60);
})();

// === FIGURA 8: Presupuesto (dona) ===
(function(){
    var c=document.getElementById('c8');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);
    var data=[
        {label:'Capacitacion',val:1000000,color:'#e74c3c'},
        {label:'Tanques',val:900000,color:'#3498db'},
        {label:'Mano de obra',val:750000,color:'#2ecc71'},
        {label:'Biofiltro',val:600000,color:'#f39c12'},
        {label:'Panel SODIS',val:475000,color:'#9b59b6'},
        {label:'Kit analisis',val:425000,color:'#1abc9c'},
        {label:'Tuberia PVC',val:325000,color:'#34495e'},
        {label:'Botellas PET',val:75000,color:'#e67e22'}
    ];
    var total=4550000;
    ctx.fillStyle='#2c3e50';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    ctx.fillText('Presupuesto Fase Piloto: $4,550,000 COP',W/2,20);
    var cx=180,cy=165,R=110,r=55;
    var startA=-Math.PI/2;
    data.forEach(function(d){
        var sweep=(d.val/total)*Math.PI*2;
        var endA=startA+sweep;
        ctx.beginPath();ctx.moveTo(cx+r*Math.cos(startA),cy+r*Math.sin(startA));
        ctx.arc(cx,cy,R,startA,endA);
        ctx.arc(cx,cy,r,endA,startA,true);
        ctx.fillStyle=d.color;ctx.fill();
        // Label line
        var midA=startA+sweep/2;
        var lx=cx+(R+15)*Math.cos(midA),ly=cy+(R+15)*Math.sin(midA);
        if(sweep>0.15){
            ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
            var tx=cx+(R-20)*Math.cos(midA),ty=cy+(R-20)*Math.sin(midA);
            ctx.fillText(Math.round(d.val/total*100)+'%',tx,ty+3);
        }
        startA=endA;
    });
    // Center text
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,r-2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0077b6';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
    ctx.fillText('$4.55M',cx,cy-2);ctx.font='9px sans-serif';ctx.fillText('COP',cx,cy+12);
    // Legend
    var lx=330,ly=50;
    data.forEach(function(d,i){
        ctx.fillStyle=d.color;ctx.fillRect(lx,ly+i*24,12,12);
        ctx.fillStyle='#333';ctx.font='10px sans-serif';ctx.textAlign='left';
        var pct=Math.round(d.val/total*100);
        ctx.fillText(d.label+' ('+pct+'%)',lx+18,ly+i*24+10);
    });
})();
