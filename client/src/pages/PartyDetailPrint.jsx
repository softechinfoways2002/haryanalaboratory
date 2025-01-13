import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPDF from "@react-pdf/renderer";
import AccountLedger from "./AccountLedger";
const headers = ["Date", "PartyName", "Reportno", "Credit", "Debit", "Remarks"];

const LedgerReport = () => {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [firstComboBox, setFirstComboBox] = useState("");
  const [secondComboBox, setSecondComboBox] = useState("");
  const [thirdComboBox, setThirdComboBox] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/customersPartyName")
      .then((response) => {
        console.log(response.data);
        setCustomers(response.data);
      });
  }, []);

  useEffect(() => {
    if (thirdComboBox) {
      // Only make the API call if the third combo box has a value

      const params = {
        state: firstComboBox,
        city: secondComboBox,
        district: thirdComboBox,
      };

      console.log(params);
      const fetchData = async () => {
        try {
          const response = await axios.post(
            "http://localhost:3001/api/usersFindData",
            params
          );
          console.log("API Response:", response.data);
          if (response) {
            setData(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [thirdComboBox, firstComboBox, secondComboBox]); // Trigger API call when thirdComboBox changes

  const HandleClick = async () => {
    console.log("Print");
    data.Count = data.filter((item) => item.Reportno !== "null").length;
    // console.log(filteredData[0].Date);
    const pdfBlob = await ReactPDF.pdf(
      <AccountLedger
        Data={data}
        Balance={0}
        OpeningBalance={0}
        Date1={data[0].Date}
        Date2={data[data.length - 1].Date}
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
  };

  return (
    <div className="bg-gray-100">
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          <form>
            <fieldset className="w-full p-3 mt-5 border border-gray-300 rounded-md">
              <legend className="text-sm">Ledger Report</legend>
              <div className="space-y-6">
                {/* Row: State Label and Dropdown */}
                <div className="flex space-x-6">
                  {/* State Label and Dropdown */}
                  <div className="flex items-center space-x-4">
                    <label
                      htmlFor="stateDropdown"
                      className="w-24 font-medium text-right"
                    >
                      State
                    </label>
                    <select
                      id="stateDropdown"
                      name="stateDropdown"
                      className="w-64 h-8 p-1 border border-gray-300 rounded-md"
                      onChange={(e) => setFirstComboBox(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {customers &&
                        [...new Set(customers.map((item) => item.State))].map(
                          (state, index) => (
                            <option key={index} value={state}>
                              {state}
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  {/* City Label and Dropdown */}
                  <div className="flex items-center space-x-4">
                    <label
                      htmlFor="cityDropdown"
                      className="w-24 font-medium text-right"
                    >
                      City
                    </label>
                    <select
                      id="cityDropdown"
                      name="cityDropdown"
                      className="w-64 h-8 p-1 border border-gray-300 rounded-md"
                      onChange={(e) => setSecondComboBox(e.target.value)}
                    >
                      <option value="">Select City</option>
                      {customers &&
                        [...new Set(customers.map((item) => item.City))].map(
                          (City, index) => (
                            <option key={index} value={City}>
                              {City}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center space-x-4">
                    <label
                      htmlFor="districtInput"
                      className="w-24 font-medium text-right"
                    >
                      District
                    </label>
                    <select
                      id="dristrictDropdown"
                      name="districtDropdown"
                      className="w-64 h-8 p-1 border border-gray-300 rounded-md"
                      onChange={(e) => setThirdComboBox(e.target.value)}
                    >
                      <option value="">Select District</option>
                      {customers &&
                        [
                          ...new Set(customers.map((item) => item.District)),
                        ].map((District, index) => (
                          <option key={index} value={District}>
                            {District}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* table grid */}
              <div className="relative overflow-x-auto overflow-y-auto h-[360px] w-[870px] mt-3">
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
                            width: "100px",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data &&
                      data.map((row, i) => (
                        <tr
                          key={i}
                          className="transition-colors duration-300 hover:bg-blue-500 hover:text-white"
                        >
                          {headers.map((header, j) => (
                            <td
                              key={j}
                              className={`border-gray-300 border text-sm whitespace-nowrap ${
                                j < headers.length - 1 ? "pr-0" : ""
                              }`}
                              style={{ minWidth: "150px" }} // Set minimum width for data cells
                            >
                              {row[header] !== "null" &&
                              row[header] !== null &&
                              row[header] !== undefined
                                ? row[header]
                                : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="h-8 px-4 py-1 bg-gray-400 rounded-md"
                  onClick={HandleClick}
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
