function generarHTMLRecibo(recibo, tipo) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial; font-size: 12px; }
        .tipo { font-weight: bold; text-align: right; }
    </style>
</head>
<body>

<div class="tipo">${tipo}</div>

<h3>CONSTANCIA DE PAGO</h3>
<p>Número: ${recibo.id}</p>

<p><strong>Recibimos de:</strong> ${recibo.cliente}</p>
<p><strong>Fecha:</strong> ${recibo.fecha}</p>

<hr>

<p>
    El valor recibido del Cotizante o Afiliado es únicamente para el trámite de pago
    ante el Sistema de Seguridad Social o Aseguradoras.
</p>

<p><strong>TOTAL:</strong> $ ${recibo.total}</p>

</body>
</html>
`;
}

module.exports = generarHTMLRecibo;
