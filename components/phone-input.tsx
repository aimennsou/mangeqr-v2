import { CheckIcon, ChevronsUpDown } from "lucide-react";

import * as React from "react";

import * as RPNInput from "react-phone-number-input";

import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input, InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, ...props }, ref) => {
      // Define allowed countries (Algeria and France)
      const allowedCountries: CountrySelectOption[] =  [
        { label: "Afghanistan", value: "AF" },
        { label: "Afrique du Sud", value: "ZA" },
        { label: "Albanie", value: "AL" },
        { label: "Algérie", value: "DZ" },
        { label: "Allemagne", value: "DE" },
        { label: "Andorre", value: "AD" },
        { label: "Angola", value: "AO" },
        { label: "Antigua-et-Barbuda", value: "AG" },
        { label: "Arabie Saoudite", value: "SA" },
        { label: "Argentine", value: "AR" },
        { label: "Arménie", value: "AM" },
        { label: "Australie", value: "AU" },
        { label: "Autriche", value: "AT" },
        { label: "Azerbaïdjan", value: "AZ" },
        { label: "Bahamas", value: "BS" },
        { label: "Bahreïn", value: "BH" },
        { label: "Bangladesh", value: "BD" },
        { label: "Barbade", value: "BB" },
        { label: "Belgique", value: "BE" },
        { label: "Belize", value: "BZ" },
        { label: "Bénin", value: "BJ" },
        { label: "Bhoutan", value: "BT" },
        { label: "Bolivie", value: "BO" },
        { label: "Bosnie-Herzégovine", value: "BA" },
        { label: "Botswana", value: "BW" },
        { label: "Brésil", value: "BR" },
        { label: "Brunei", value: "BN" },
        { label: "Bulgarie", value: "BG" },
        { label: "Burkina Faso", value: "BF" },
        { label: "Burundi", value: "BI" },
        { label: "Cabo Verde", value: "CV" },
        { label: "Cambodge", value: "KH" },
        { label: "Cameroun", value: "CM" },
        { label: "Canada", value: "CA" },
        { label: "Centrafrique", value: "CF" },
        { label: "Chili", value: "CL" },
        { label: "Chine", value: "CN" },
        { label: "Colombie", value: "CO" },
        { label: "Comores", value: "KM" },
        { label: "Congo", value: "CG" },
        { label: "Congo (République Démocratique du)", value: "CD" },
        { label: "Costa Rica", value: "CR" },
        { label: "Croatie", value: "HR" },
        { label: "Cuba", value: "CU" },
        { label: "Chypre", value: "CY" },
        { label: "Danemark", value: "DK" },
        { label: "Djibouti", value: "DJ" },
        { label: "Dominique", value: "DM" },
        { label: "Égypte", value: "EG" },
        { label: "El Salvador", value: "SV" },
        { label: "Équateur", value: "EC" },
        { label: "Érythrée", value: "ER" },
        { label: "Espagne", value: "ES" },
        { label: "Estonie", value: "EE" },
        { label: "Eswatini", value: "SZ" },
        { label: "États-Unis", value: "US" },
        { label: "Fidji", value: "FJ" },
        { label: "Finlande", value: "FI" },
        { label: "France", value: "FR" },
        { label: "Gabon", value: "GA" },
        { label: "Gambie", value: "GM" },
        { label: "Géorgie", value: "GE" },
        { label: "Ghana", value: "GH" },
        { label: "Gibraltar", value: "GI" },
        { label: "Grèce", value: "GR" },
        { label: "Grenade", value: "GD" },
        { label: "Guadeloupe", value: "GP" },
        { label: "Guam", value: "GU" },
        { label: "Guatemala", value: "GT" },
        { label: "Guinée", value: "GN" },
        { label: "Guinée-Bissau", value: "GW" },
        { label: "Guinée équatoriale", value: "GQ" },
        { label: "Guyane", value: "GF" },
        { label: "Guyane française", value: "GF" },
        { label: "Haïti", value: "HT" },
        { label: "Honduras", value: "HN" },
        { label: "Hongrie", value: "HU" },
        { label: "Îles Caïmans", value: "KY" },
        { label: "Îles Cook", value: "CK" },
        { label: "Îles Marshall", value: "MH" },
        { label: "Îles Salomon", value: "SB" },
        { label: "Îles Turques-et-Caïques", value: "TC" },
        { label: "Inde", value: "IN" },
        { label: "Indonésie", value: "ID" },
        { label: "Irak", value: "IQ" },
        { label: "Iran", value: "IR" },
        { label: "Irlande", value: "IE" },
        { label: "Islande", value: "IS" },
        { label: "Italie", value: "IT" },
        { label: "Jamaïque", value: "JM" },
        { label: "Japon", value: "JP" },
        { label: "Jordanie", value: "JO" },
        { label: "Kazakhstan", value: "KZ" },
        { label: "Kenya", value: "KE" },
        { label: "Kirghizistan", value: "KG" },
        { label: "Kiribati", value: "KI" },
        { label: "Koweït", value: "KW" },
        { label: "Laos", value: "LA" },
        { label: "Latvia", value: "LV" },
        { label: "Lesotho", value: "LS" },
        { label: "Liban", value: "LB" },
        { label: "Liberia", value: "LR" },
        { label: "Libye", value: "LY" },
        { label: "Liechtenstein", value: "LI" },
        { label: "Lituanie", value: "LT" },
        { label: "Luxembourg", value: "LU" },
        { label: "Madagascar", value: "MG" },
        { label: "Malaisie", value: "MY" },
        { label: "Malawi", value: "MW" },
        { label: "Maldives", value: "MV" },
        { label: "Mali", value: "ML" },
        { label: "Malte", value: "MT" },
        { label: "Maroc", value: "MA" },
        { label: "Martinique", value: "MQ" },
        { label: "Maurice", value: "MU" },
        { label: "Mauritanie", value: "MR" },
        { label: "Mexique", value: "MX" },
        { label: "Micronésie", value: "FM" },
        { label: "Moldavie", value: "MD" },
        { label: "Monaco", value: "MC" },
        { label: "Mongolie", value: "MN" },
        { label: "Monténégro", value: "ME" },
        { label: "Morice", value: "MR" },
        { label: "Mozambique", value: "MZ" },
        { label: "Namibie", value: "NA" },
        { label: "Nauru", value: "NR" },
        { label: "Népal", value: "NP" },
        { label: "Nicaragua", value: "NI" },
        { label: "Niger", value: "NE" },
        { label: "Nigéria", value: "NG" },
        { label: "Niue", value: "NU" },
        { label: "Norvège", value: "NO" },
        { label: "Nouvelle-Calédonie", value: "NC" },
        { label: "Nouvelle-Zélande", value: "NZ" },
        { label: "Oman", value: "OM" },
        { label: "Pakistan", value: "PK" },
        { label: "Palaos", value: "PW" },
        { label: "Panama", value: "PA" },
        { label: "Papouasie-Nouvelle-Guinée", value: "PG" },
        { label: "Paraguay", value: "PY" },
        { label: "Pérou", value: "PE" },
        { label: "Philippines", value: "PH" },
        { label: "Pologne", value: "PL" },
        { label: "Porto Rico", value: "PR" },
        { label: "Portugal", value: "PT" },
        { label: "Qatar", value: "QA" },
        { label: "République Centrafricaine", value: "CF" },
        { label: "République Dominicaine", value: "DO" },
        { label: "République Démocratique du Congo", value: "CD" },
        { label: "Roumanie", value: "RO" },
        { label: "Royaume-Uni", value: "GB" },
        { label: "Russie", value: "RU" },
        { label: "Rwanda", value: "RW" },
        { label: "Saint-Christophe-et-Niévès", value: "KN" },
        { label: "Saint-Marin", value: "SM" },
        { label: "Saint-Timor", value: "ST" },
        { label: "Sainte-Lucie", value: "LC" },
        { label: "Sainte-Hélène", value: "SH" },
        { label: "Saint-Vincent-et-les-Grenadines", value: "VC" },
        { label: "Salvador", value: "SV" },
        { label: "Samoa", value: "WS" },
        { label: "Sao Tomé-et-Principe", value: "ST" },
        { label: "Sénégal", value: "SN" },
        { label: "Serbie", value: "RS" },
        { label: "Seychelles", value: "SC" },
        { label: "Sierra Leone", value: "SL" },
        { label: "Singapour", value: "SG" },
        { label: "Slovaquie", value: "SK" },
        { label: "Slovénie", value: "SI" },
        { label: "Somalie", value: "SO" },
        { label: "Soudan", value: "SD" },
        { label: "Soudan du Sud", value: "SS" },
        { label: "Sri Lanka", value: "LK" },
        { label: "Suède", value: "SE" },
        { label: "Suisse", value: "CH" },
        { label: "Suriname", value: "SR" },
        { label: "Syrie", value: "SY" },
        { label: "Tadjikistan", value: "TJ" },
        { label: "Taïwan", value: "TW" },
        { label: "Tanzanie", value: "TZ" },
        { label: "Tchad", value: "TD" },
        { label: "Thailande", value: "TH" },
        { label: "Timor-Leste", value: "TL" },
        { label: "Togo", value: "TG" },
        { label: "Tonga", value: "TO" },
        { label: "Trinité-et-Tobago", value: "TT" },
        { label: "Tunisie", value: "TN" },
        { label: "Turkménistan", value: "TM" },
        { label: "Turquie", value: "TR" },
        { label: "Tuvalu", value: "TV" },
        { label: "Ukraine", value: "UA" },
        { label: "Uruguay", value: "UY" },
        { label: "Vanuatu", value: "VU" },
        { label: "Venezuela", value: "VE" },
        { label: "Vietnam", value: "VN" },
        { label: "Yémen", value: "YE" },
        { label: "Zambie", value: "ZM" },
        { label: "Zimbabwe", value: "ZW" },
      ];

      return (
        <RPNInput.default
          ref={ref}
          className={cn("flex", className)}
          flagComponent={FlagComponent}
          countrySelectComponent={(props) => (
            <CountrySelect {...props} options={allowedCountries} />
          )}
          inputComponent={InputComponent}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          onChange={(value: any) => onChange?.(value || "")}
          {...props}
        />
      );
    }
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      className={cn("rounded-e-lg rounded-s-none", className)}
      {...props}
      ref={ref}
    />
  )
);
InputComponent.displayName = "InputComponent";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
    },
    [onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn("flex gap-1 rounded-e-none rounded-s-lg px-3")}
          disabled={disabled}
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDown
            className={cn(
              "-mr-2 h-4 w-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput placeholder="Rechercher un pays..." />
              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    className="gap-2"
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <FlagComponent
                      country={option.value}
                      countryName={option.label}
                    />
                    <span className="flex-1 text-sm">{option.label}</span>
                    {option.value && (
                      <span className="text-sm text-foreground/50">
                        {`+${RPNInput.getCountryCallingCode(option.value)}`}
                      </span>
                    )}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
FlagComponent.displayName = "FlagComponent";

export { PhoneInput };
