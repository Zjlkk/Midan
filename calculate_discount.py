
import argparse

def calculate_discount(principal, apr):
    """
    Calculates the discount based on the principal and APR.

    Args:
        principal (float): The principal amount.
        apr (float): The Annual Percentage Rate (APR) as a decimal.

    Returns:
        None
    """

    future_value = principal * (1 + apr)
    discount_value = future_value - principal
    discount_rate = (discount_value / future_value) * 100

    print(f"本金: ${principal:,.2f}")
    print(f"年化利率 (APR): {apr:.2%}")
    print(f"一年后总价值: ${future_value:,.2f}")
    print(f"年利息: ${discount_value:,.2f}")
    print(f"等效折扣率: {discount_rate:.2f}%")

def main():
    """
    Main function to parse arguments and call the calculation function.
    """
    parser = argparse.ArgumentParser(description="Calculate discount from APR.")
    parser.add_argument("--principal", type=float, default=150000, help="The principal amount.")
    parser.add_argument("--apr", type=float, default=0.30, help="The Annual Percentage Rate (APR) as a decimal (e.g., 0.30 for 30%).")
    
    args = parser.parse_args()
    
    calculate_discount(args.principal, args.apr)

if __name__ == "__main__":
    main() 