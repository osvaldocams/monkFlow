export const formatDate = (date: Date) => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul',
        'ago', 'sep', 'oct', 'nov', 'dic'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
