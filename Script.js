// ============================
// MODE SWITCHING
// ============================

const mode = document.getElementById("mode");
const manualSection = document.getElementById("manualSection");
const csvSection = document.getElementById("csvSection");

mode.addEventListener("change", () => {

    if (mode.value === "manual") {
        manualSection.classList.remove("hidden");
        csvSection.classList.add("hidden");
    } else {
        manualSection.classList.add("hidden");
        csvSection.classList.remove("hidden");
    }

});

// ============================
// CALCULATION TYPE
// ============================

const calcType = document.getElementById("calcType");

calcType.addEventListener("change", () => {

    document
        .getElementById("proportionInputs")
        .classList.toggle(
            "hidden",
            calcType.value !== "proportion"
        );

    document
        .getElementById("meanInputs")
        .classList.toggle(
            "hidden",
            calcType.value !== "mean"
        );

    calculate();

});

// ============================
// SYNCHRONIZE RANGE + NUMBER
// ============================

function sync(rangeId, inputId) {

    const range = document.getElementById(rangeId);
    const input = document.getElementById(inputId);

    if (!range || !input) return;

    range.addEventListener("input", () => {
        input.value = range.value;
        calculate();
    });

    input.addEventListener("input", () => {
        range.value = input.value;
        calculate();
    });

}

// Proportion
sync("p0Range", "p0");
sync("phatRange", "phat");
sync("nRange", "n");

// Mean
sync("mu0Range", "mu0");
sync("xbarRange", "xbar");
sync("sigmaRange", "sigma");
sync("nMeanRange", "nMean");

// ============================
// NORMAL DISTRIBUTION
// ============================

function erf(x) {

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);

    const y =
        1 -
        (
            (
                (
                    (
                        (a5 * t + a4) * t
                        + a3
                    ) * t
                    + a2
                ) * t
                + a1
            ) * t
        ) * Math.exp(-x * x);

    return sign * y;
}

function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// ============================
// NORMAL CURVE CHART
// ============================

const xValues = [];
const yValues = [];

for (let x = -4; x <= 4; x += 0.1) {

    xValues.push(x.toFixed(2));

    yValues.push(
        (1 / Math.sqrt(2 * Math.PI))
        *
        Math.exp(-(x * x) / 2)
    );

}

const ctx = document
    .getElementById("normalChart")
    .getContext("2d");

const normalChart = new Chart(ctx, {

    type: "line",

    data: {

        labels: xValues,

        datasets: [

            {
                label: "Normal Distribution",

                data: yValues,

                borderWidth: 3,

                tension: 0.3,

                fill: false
            }

        ]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {
                display: true
            }

        }

    }

});

// ============================
// CRITICAL VALUES
// ============================

function criticalValue(alpha, tail) {

    if (tail === "two") {

        if (alpha === 0.10) return 1.645;
        if (alpha === 0.05) return 1.96;
        if (alpha === 0.01) return 2.576;

        return 1.96;

    }

    if (alpha === 0.10) return 1.282;
    if (alpha === 0.05) return 1.645;
    if (alpha === 0.01) return 2.326;

    return 1.645;

}

// ============================
// MAIN CALCULATION
// ============================

function calculate() {

    let z = 0;

    if (calcType.value === "proportion") {

        const p0 =
            parseFloat(
                document.getElementById("p0").value
            );

        const phat =
            parseFloat(
                document.getElementById("phat").value
            );

        const n =
            parseFloat(
                document.getElementById("n").value
            );

        z =
            (phat - p0)
            /
            Math.sqrt(
                (p0 * (1 - p0))
                /
                n
            );

    }

    else {

        const mu0 =
            parseFloat(
                document.getElementById("mu0").value
            );

        const xbar =
            parseFloat(
                document.getElementById("xbar").value
            );

        const sigma =
            parseFloat(
                document.getElementById("sigma").value
            );

        const n =
            parseFloat(
                document.getElementById("nMean").value
            );

        z =
            (xbar - mu0)
            /
            (sigma / Math.sqrt(n));

    }

    const tail =
        document.getElementById("tail").value;

    let pValue = 0;

    if (tail === "left") {

        pValue = normalCDF(z);

    }

    else if (tail === "right") {

        pValue = 1 - normalCDF(z);

    }

    else {

        pValue =
            2 *
            (
                1 -
                normalCDF(
                    Math.abs(z)
                )
            );

    }

    const alpha =
        parseFloat(
            document.getElementById("alpha").value
        );

    const critical =
        criticalValue(alpha, tail);

    const reject =
        pValue < alpha;

    document.getElementById("zValue")
        .textContent = z.toFixed(4);

    document.getElementById("pValue")
        .textContent = pValue.toFixed(6);

    document.getElementById("criticalValue")
        .textContent =
        tail === "two"
            ? `±${critical}`
            : critical;

    const decision =
        document.getElementById("decision");

    if (reject) {

        decision.textContent =
            "Reject H₀";

        decision.classList.add("reject");
        decision.classList.remove("accept");

    }

    else {

        decision.textContent =
            "Fail to Reject H₀";

        decision.classList.add("accept");
        decision.classList.remove("reject");

    }

    document.getElementById("conclusion")
        .textContent =
        reject
            ? "There is sufficient statistical evidence to support the alternative hypothesis."
            : "There is insufficient statistical evidence to support the alternative hypothesis.";

}

// ============================
// CSV IMPORT
// ============================

const csvInput =
    document.getElementById("csvFile");

if (csvInput) {

    csvInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (!file) return;

            const reader =
                new FileReader();

            reader.onload =
                function (e) {

                    const csv =
                        e.target.result;

                    const rows =
                        csv
                        .trim()
                        .split("\n");

                    const headers =
                        rows[0]
                        .split(",");

                    const groupA =
                        document.getElementById("groupA");

                    const groupB =
                        document.getElementById("groupB");

                    groupA.innerHTML = "";
                    groupB.innerHTML = "";

                    headers.forEach(header => {

                        const option1 =
                            document.createElement("option");

                        option1.value = header;
                        option1.textContent = header;

                        const option2 =
                            option1.cloneNode(true);

                        groupA.appendChild(option1);
                        groupB.appendChild(option2);

                    });

                    alert(
                        "CSV loaded successfully!"
                    );

                };

            reader.readAsText(file);

        }
    );

}

// ============================
// EVENTS
// ============================

document
.getElementById("alpha")
.addEventListener(
    "input",
    calculate
);

document
.getElementById("tail")
.addEventListener(
    "change",
    calculate
);

// Initial calculation
calculate();