import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as SecureStore from "expo-secure-store";
import { MaterialIcons } from "@expo/vector-icons";

import { fetchExchangeRates } from "@/constants/Apis";
import { getAllCurrencies } from "@/constants/Apis";
import { ConversionState } from "@/constants/ConversionState";
import { CurrencyData } from "@/constants/CurrencyData";
import ConvertModule from "@/components/ConvertModule";

export default function CurrencyConverter() {
  const [state, setState] = useState<ConversionState>({
    fromCurrency: "USD",
    toCurrency: "EUR",
    amount: "1",
    convertedAmount: "",
    rates: {},
  });

  const currencies = getAllCurrencies();

  useEffect(() => {
    loadLastUsedSettings();
  }, []);

  useEffect(() => {
    fetchRates();
  }, [state.fromCurrency]);

  const loadLastUsedSettings = async () => {
    try {
      const lastFromCurrency = await SecureStore.getItemAsync("fromCurrency");
      const lastToCurrency = await SecureStore.getItemAsync("toCurrency");
      const lastAmount = await SecureStore.getItemAsync("amount");

      setState((prev) => ({
        ...prev,
        fromCurrency: lastFromCurrency || "USD",
        toCurrency: lastToCurrency || "EUR",
        amount: lastAmount || "1",
      }));
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const fetchRates = async () => {
    try {
      const rates = await fetchExchangeRates(state.fromCurrency);
      setState((prev) => ({ ...prev, rates }));
      if (state.amount) {
        convertCurrency(state.amount, rates);
      }
    } catch (error) {
      console.error("Rate fetch error:", error);
    }
  };

  const convertCurrency = (inputAmount: string, currentRates = state.rates) => {
    if (!inputAmount) {
      setState((prev) => ({ ...prev, amount: "", convertedAmount: "" }));
      return;
    }

    const amount = parseFloat(inputAmount);
    if (isNaN(amount)) {
      setState((prev) => ({ ...prev, convertedAmount: "" }));
      return;
    }

    const rate = currentRates[state.toCurrency] || 1;
    const converted = (amount * rate).toFixed(2);

    setState((prev) => ({
      ...prev,
      amount: inputAmount,
      convertedAmount: converted,
    }));

    // persisting the user's past settings
    SecureStore.setItemAsync("fromCurrency", state.fromCurrency);
    SecureStore.setItemAsync("toCurrency", state.toCurrency);
    SecureStore.setItemAsync("amount", inputAmount);
  };

  const handleSwapCurrencies = () => {
    setState((prev) => {
      // swaping currencies
      const newFromCurrency = prev.toCurrency;
      const newToCurrency = prev.fromCurrency;

      // swaping amounts and converting based on current rate
      const newAmount = prev.convertedAmount || "0";

      return {
        ...prev,
        fromCurrency: newFromCurrency,
        toCurrency: newToCurrency,
        amount: newAmount,
        convertedAmount: prev.amount,
      };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Currency Converter</Text>

      <View style={styles.converterContainer}>
        <ConvertModule
          label="From:"
          pickerSelectedValue={state.fromCurrency}
          onPickerValueChange={(itemValue) => {
            setState((prev) => ({ ...prev, fromCurrency: itemValue }));
            convertCurrency(state.amount);
          }}
          amount={state.amount}
          onAmountValueChange={(text) => {
            text = text.replaceAll(/[^0-9]/g, "");
            convertCurrency(text);
          }}
          isEditabled={true}
        />

        <TouchableOpacity
          style={styles.swapButton}
          onPress={handleSwapCurrencies}
          activeOpacity={0.8}
        >
          <MaterialIcons name="swap-vert" size={24} color="#888" />
        </TouchableOpacity>

        <ConvertModule
          label="To:"
          pickerSelectedValue={state.toCurrency}
          onPickerValueChange={(itemValue) => {
            setState((prev) => ({ ...prev, toCurrency: itemValue }));
            convertCurrency(state.amount);
          }}
          amount={state.convertedAmount}
          onAmountValueChange={(text) => {}}
          isEditabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  converterContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  resultInput: {
    backgroundColor: "#e9ecef",
    color: "#495057",
  },
  swapButton: {
    alignSelf: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
