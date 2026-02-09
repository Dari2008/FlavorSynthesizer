import "./FlavorStatistic.scss";

export default function FlavorStatistic({ imgSrc, desc, value, unit, ref }: { imgSrc: string; desc: string; value: string | number; unit: string; ref?: React.RefObject<HTMLSpanElement | null> }) {
    return <div className="flavor-statistic">
        {/* <img src={imgSrc} alt={"Image for " + desc} className="icon" /> */}
        <div className="icon"></div>
        <span className="value" ref={ref}>{value} {unit}</span>
        <span className="desc">{desc}</span>
    </div>
}