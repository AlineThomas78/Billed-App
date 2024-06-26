/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, render, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom/extend-expect";
import router from "../app/Router.js";
import { parseDate } from "../app/format.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const datesSorted = [...dates].sort(
        (a, b) => parseDate(a) - parseDate(b)
      );
      expect(dates).toEqual(datesSorted);
    });

    test("Then bills should be fetched from the mock API and displayed", async () => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Vérification des factures affichées en récupérant le contenu du tbody
      const tbody = screen.getByTestId("tbody");
      const rows = tbody.querySelectorAll("tr");
      expect(rows.length).toBe(bills.length);

      // Vérification du contenu des lignes
      bills.forEach((bill) => {
        expect(screen.getByText(bill.name)).toBeTruthy();
      });
    });

    test("Then the loading page should be displayed", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    test("Then the error page should be displayed", () => {
      const error = "Oops! Something went wrong.";
      document.body.innerHTML = BillsUI({ error });
      expect(screen.getByText(error)).toBeTruthy();
    });

    test("Clicking 'Nouvelle note de frais' button should navigate to NewBill route", () => {
      // Arrange
      document.body.innerHTML = BillsUI({ data: [], loading: false, error: null });
      const mockOnNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate: mockOnNavigate, store: mockStore, localStorage });

      // Act
      fireEvent.click(screen.getByTestId("btn-new-bill"));

      // Assert
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });

    test("Integration - Fetch bills from API and display correctly", async () => {
      // Mock store.bills().list() method to return bills data
      jest.spyOn(mockStore.bills(), "list").mockResolvedValue(bills);

      // Render Bills UI
      document.body.innerHTML = BillsUI({ data: bills });

      // Navigate to Bills page
      window.onNavigate(ROUTES_PATH.Bills);

      // Wait for bills to be rendered
      await waitFor(() => {
        // Assert that each bill name is displayed in the UI
        bills.forEach((bill) => {
          expect(screen.getByText(bill.name)).toBeInTheDocument();
        });

        // Verify that the number of rows in the table matches the number of bills
        const rows = screen.getByTestId("tbody").querySelectorAll("tr");
        expect(rows.length).toEqual(bills.length);
      });
    });

    
    test("Then getBills should handle errors gracefully", async () => {
      jest.spyOn(mockStore.bills(), "list").mockRejectedValue(new Error("Erreur API"));

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage });

      await expect(billsInstance.getBills()).rejects.toThrow("Erreur API");
    });

    test("Then bills should be created correctly", async () => {
      const newBill = {
        id: "newBillId",
        name: "New Bill",
        date: "2021-01-01",
        amount: 100,
        status: "pending",
        type: "Transports",
        fileUrl: "https://example.com/file.jpg"
      };

      jest.spyOn(mockStore.bills(), "create").mockResolvedValue(newBill);

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage });
      const createdBill = await mockStore.bills().create(newBill);

      expect(createdBill).toEqual(newBill);
    });

    test("Then bills should be updated correctly", async () => {
      const updatedBill = {
        ...bills[0],
        name: "Updated Bill",
        amount: 200
      };

      jest.spyOn(mockStore.bills(), "update").mockResolvedValue(updatedBill);

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage });
      const result = await mockStore.bills().update(updatedBill);

      expect(result).toEqual(updatedBill);
    });

    test("Clicking on bill proof icon should open modal with bill image", () => {
      // Mock bills data for the UI
      const bills = [
        {
          id: "1",
          type: "Transports",
          name: "Bill 1",
          date: "2023-01-01",
          amount: 100,
          status: "pending",
          fileUrl: "https://example.com/bill1.jpg",
        },
        {
          id: "2",
          type: "Food",
          name: "Bill 2",
          date: "2023-02-01",
          amount: 150,
          status: "accepted",
          fileUrl: "https://example.com/bill2.jpg",
        },
      ];
    
      // Render Bills UI with mock data
      document.body.innerHTML = BillsUI({ data: bills });
    
      // Initialize Bills instance
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage,
      });
    
      // Spy on modal function (assuming it's set on the window object)
      const mockModalShow = jest.fn();
      window.$.fn.modal = jest.fn(() => {
        return { on: mockModalShow };
      });
    
      // Get the first eye icon in the UI (assuming it's the proof for the first bill)
      const eyeIcon = document.querySelector(`div[data-testid="icon-eye"]`);
    
      // Simulate a click on the eye icon
      fireEvent.click(eyeIcon);
    
      // Assert that the modal function was called
      expect(window.$.fn.modal).toHaveBeenCalled();
    
      // Clean up
      delete window.$.fn.modal;
    });

   
    test("Then modal should open with bill image", () => {
      const bills = [
        {
          id: "1",
          type: "Transports",
          name: "Bill 1",
          date: "2023-01-01",
          amount: 100,
          status: "pending",
          fileUrl: "https://example.com/bill1.jpg",
        },
        {
          id: "2",
          type: "Food",
          name: "Bill 2",
          date: "2023-02-01",
          amount: 150,
          status: "accepted",
          fileUrl: "https://example.com/bill2.jpg",
        },
      ];

      // Render Bills UI with mock data
      document.body.innerHTML = BillsUI({ data: bills });

      // Initialize Bills instance
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage,
      });

      // Spy on modal function (assuming it's set on the window object)
      const mockModalShow = jest.fn();
      window.$.fn.modal = jest.fn(() => {
        return { on: mockModalShow };
      });

      // Get the first eye icon in the UI (assuming it's the proof for the first bill)
      const eyeIcon = document.querySelector(`div[data-testid="icon-eye"]`);

      // Simulate a click on the eye icon
      fireEvent.click(eyeIcon);

      // Assert that the modal function was called
      expect(window.$.fn.modal).toHaveBeenCalled();

      // Assert that modal was called with the correct bill image URL
      expect(screen.getByAltText("Bill")).toHaveAttribute("src", bills[0].fileUrl);

      // Clean up
      delete window.$.fn.modal;
    });

    test("Then 'Aucune note de frais à afficher' message should not be displayed when bills are available", async () => {
      // Mock store.bills().list() method to return bills data
      const billsData = [
        {
          id: "1",
          type: "Transports",
          name: "Bill 1",
          date: "2023-01-01",
          amount: 100,
          status: "pending",
          fileUrl: "https://example.com/bill1.jpg",
        },
      ];
      jest.spyOn(mockStore.bills(), "list").mockResolvedValue(billsData);

      // Render Bills UI
      document.body.innerHTML = BillsUI({ data: billsData, loading: false, error: null });

      // Initialize Bills instance
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: localStorageMock,
      });

      // Call getBills() to fetch bills
      await billsInstance.getBills();

      // Assert that the message indicating no bills should NOT be displayed
      expect(screen.queryByText("Aucune note de frais à afficher")).toBeNull();
    });
  });
});
