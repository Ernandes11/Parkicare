function irPara(url) {
    window.location.href = url;
}

function formatarTel(tel) {
    if (!tel) return '';
    const limpo = tel.replace(/\D/g, '');
    if (limpo.length === 13) { // 55 + DDD + 9 digits
        return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
    }
    if (limpo.length === 11) { // DDD + 9 digits
        return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
    }
    return tel;
}
