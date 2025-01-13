import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPDF from "@react-pdf/renderer";
import AccountLedger from "./AccountLedger";
const headers = ["Entry Date", "Report Number", "Credit", "Debit", "Remarks"];
const LedgerReport = () => {
  const [data, setData] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [Dates, getDates] = useState({});
  const [PartyName, setPartyName] = useState("");
  const [Party, setSelectedParty] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [Values, setValues] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    try {
      axios
        .get("http://localhost:3001/api/customers")
        .then((response) => {
          console.log(response.data);
          setCustomer(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchData = (data) => {
    try {
      console.log("FetchData working");
      axios
        .get(`http://localhost:3001/api/analysises/${data}`)
        .then((response) => {
          console.log(response.data);
          setReportData(response.data.length);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const handlePartySelect = (event) => {
    const partyName = event.target.value;
    const party = customer.find((p) => p.Partyname === partyName);
    console.log(party);
    setSelectedParty(party);
    setPartyName(partyName);
    party ? fetchData(party.Name) : setReportData("");

    if (!party) {
      setFilteredData(data);
    } else {
      const sum = data
        .filter((item) => item.PartyName === partyName)
        .reduce((acc, item) => acc + Number(item.Debit), 0);
      const sub = data
        .filter((item) => item.PartyName === partyName)
        .reduce((acc, item) => acc + Number(item.Credit), 0);

      console.log(sub);
      const OpeningBalance =
        Number(party.Openingbalance) > 0 || Number(party.Openingbalance) < 0
          ? Number(party.Openingbalance)
          : 10;
      console.log(OpeningBalance);
      const total = sub - sum + OpeningBalance;
      console.log(total);
      setValues({
        Total: sub,
        Paid: sum,
        Balance: total,
        ClosingBalance: sub - sum,
      });
      setFilteredData(data.filter((item) => item.PartyName === partyName));
    }
  };

  const findData = async () => {
    try {
      await axios
        .get(
          `http://localhost:3001/api/usersDate/${Dates.fromDate}/${Dates.toDate}`
        )
        .then((response) => {
          if (response) {
            console.log(response.data);
            const formattedReports = response.data.map((item) => ({
              ...item, // Spread the original report object
              Date: formatDate(item.Date), // Format the Date field
            }));
            setData(formattedReports);
            setFilteredData(formattedReports);

            const sum = response.data
              .filter((item) => Number(item.Amount) > 0)
              .reduce((acc, total) => acc + Number(total.Amount), 0);

            const sub = response.data
              .filter((item) => Number(item.Amount) < 0)
              .reduce((acc, total) => acc + Number(total.Amount), 0);
            const total = sub + sum;
            console.log(
              sum,
              " And ",
              String(sub).substring(1),
              " And Total is ",
              String(total).substring(1)
            );

            setValues({
              Total: String(sub).substring(1),
              Paid: String(sum),
              Balance: String(total).substring(1),
            });
          } else {
            console.log("No Data Found");
            setData([]);
            setFilteredData([]);
          }
        })
        .catch((err) => console.log(err));
    } catch (error) {
      console.log(error);
    }
  };

  const generateAndOpenPdf = async () => {
    // Generate the PDF and create a Blob URL
    console.log(Values.Balance);
    if (filteredData.length > 0 && Values.Balance) {
      filteredData.Count = filteredData.filter(
        (item) => item.Reportno !== "null"
      ).length;
      const pdfBlob = await ReactPDF.pdf(
        <AccountLedger
          Data={filteredData}
          Balance={Values.Balance}
          OpeningBalance={Party.Openingbalance}
          Date1={formatDate(Dates.fromDate)}
          Date2={formatDate(Dates.toDate)}
          PartyName={Party.Partyname}
          City={Party.City}
        />
      ).toBlob();
      const newBlobUrl = URL.createObjectURL(pdfBlob);
      console.log("Generated new Blob URL:", newBlobUrl);
      // Open the new Blob URL in a new tab
      window.open(newBlobUrl);

      // Clean up the previous Blob URL if it exists
      if (pdfBlobUrl) {
        console.log("Revoking old Blob URL:", pdfBlobUrl);
        let text = URL.revokeObjectURL(pdfBlobUrl);
        console.log(text);
      }

      // Update the state with the new Blob URL

      setPdfBlobUrl(newBlobUrl);
    }
  };

  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const day = String(date.getDate()).padStart(2, "0"); // Pad with 0 if single digit
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-gray-100">
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          <form>
            <fieldset className="w-full p-3 border border-gray-300 rounded-md">
              <legend className="text-sm">Ledger Report</legend>
              <div className="flex justify-center space-x-14">
                <div className="flex items-center space-x-6">
                  <label htmlFor="fromDate" className="font-medium">
                    From
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    required
                    className="h-5 p-2 border border-gray-300"
                    onChange={(e) => {
                      getDates({ ...Dates, [e.target.name]: e.target.value });
                    }}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label htmlFor="toDate" className="font-medium ">
                    To
                  </label>
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    required
                    className="h-5 p-2 border border-gray-300"
                    onChange={(e) => {
                      getDates({ ...Dates, [e.target.name]: e.target.value });
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2 mr-24 ">
                <button
                  type="submit"
                  className="h-8 px-4 py-1 bg-gray-400 rounded-md"
                  onClick={findData}
                >
                  Display
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-36">
                <div className="flex items-center space-x-4">
                  <label htmlFor="party" className="font-medium ">
                    Party
                  </label>
                  <select
                    required
                    className="box-border w-[70%] h-8 p-1 border border-gray-300 rounded-md appearance-none cursor-pointer"
                    onChange={handlePartySelect}
                    value={PartyName || ""}
                  >
                    <option value="">Select Party</option>
                    {customer &&
                      customer.map((party, index) => (
                        <option key={index} value={party.Partyname}>
                          {party.Partyname}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label htmlFor="city" className="font-medium ">
                    City : {Party ? Party.City : ""}
                  </label>
                </div>
                <div className="flex flex-col space-y-1">
                  <label htmlFor="totalSamples" className="font-medium ">
                    Total no. of samples: {reportData ? reportData : ""}
                  </label>
                </div>
                <div className="flex flex-col space-y-1">
                  <label htmlFor="openingBalance" className="font-medium ">
                    Opening balance: {Party ? Party.Openingbalance : ""}
                  </label>
                </div>
              </div>
              {/* table grid */}

              <div className="relative overflow-x-auto overflow-y-auto h-[320px] w-[850px]">
                <table className="min-w-full bg-white border border-gray-300 table-auto">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      {headers.map((header, index) => (
                        <th
                          key={index}
                          className="text-sm text-left border-gray-300 whitespace-nowrap"
                          style={{
                            fontSize: "13px",
                            fontWeight: "normal",
                            minWidth: "150px", // Set minimum width for headers
                            width: "150px",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr
                        key={i}
                        className="transition-colors duration-300 hover:bg-blue-500 hover:text-white"
                      >
                        <td
                          className="border-gray-300 border text-sm whitespace-nowrap"
                          style={{ minWidth: "150px" }}
                        >
                          {row.Date}
                        </td>
                        <td
                          className="border-gray-300 border text-sm whitespace-nowrap"
                          style={{ minWidth: "150px" }}
                        >
                          {row.Reportno === "null" ? "" : row.Reportno}
                        </td>
                        <td
                          className="border-gray-300 border text-sm whitespace-nowrap"
                          style={{ minWidth: "150px" }}
                        >
                          {row.Credit}
                        </td>
                        <td
                          className="border-gray-300 border text-sm whitespace-nowrap"
                          style={{ minWidth: "150px" }}
                        >
                          {row.Debit}
                        </td>
                        <td
                          className="border-gray-300 border text-sm whitespace-nowrap"
                          style={{ minWidth: "150px" }}
                        >
                          {row.Remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex-1">
                  <label htmlFor="totalAmount" className="block font-medium ">
                    Total Amount : {Values ? Values.Total : ""}
                  </label>
                </div>
                <div className="flex-1">
                  <label htmlFor="paidAmount" className="block font-medium ">
                    Paid Amount : {Values ? Values.Paid : ""}
                  </label>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="openingBalance"
                    className="block font-medium "
                  >
                    Balance : {Values ? Values.Balance : ""}
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="h-8 px-4 py-1 bg-gray-400 rounded-md"
                  onClick={generateAndOpenPdf}
                >
                  Print
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LedgerReport;
