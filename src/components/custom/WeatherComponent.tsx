const WeatherCard = ({ temperature }: { temperature: number }) => (
    <div>
        <h2>Current Weather</h2>
        <p>Temperature: {temperature}°C</p>
    </div>
);

export default WeatherCard;