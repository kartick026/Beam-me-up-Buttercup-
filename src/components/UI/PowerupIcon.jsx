export const PowerupIcon = ({ type }) => {
    const color = type === 'rapid' ? '#00ff00' : type === 'double' ? '#ffff00' : '#00ffff';
    const label = type === 'rapid' ? 'R' : type === 'double' ? 'D' : 'S';
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill={color} />
            <text x="12" y="16" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">{label}</text>
        </svg>
    );
};
