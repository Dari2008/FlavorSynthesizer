import "./FlavorStatistic.scss";

export default function FlavorStatistic({ imgSrc, desc, value, unit }: { imgSrc: string; desc: string; value: string | number; unit: string; }) {
    return <div className="flavor-statistic">
        {/* <img src={imgSrc} alt={"Image for " + desc} className="icon" /> */}
        <div className="icon"></div>
        <span className="value">{value} {unit}</span>
        <span className="desc">{desc}</span>
    </div>
}