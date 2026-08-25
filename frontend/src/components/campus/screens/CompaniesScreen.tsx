import { useNavigate } from "react-router-dom";
import { Building2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllCompanies, type Company } from "@/integrations/external/companyApi";
import { CompanySearch } from "@/components/companies";

export function CompaniesScreen() {
  const navigate = useNavigate();

  const handleCompanySelect = (company: { name: string }) => {
    navigate(`/companies/${encodeURIComponent(company.name)}`);
  };

  const { data: companies, isLoading } = useQuery({
    queryKey: ["allCompanies"],
    queryFn: getAllCompanies,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="pb-24 bg-gradient-subtle min-h-full">
      <header className="relative px-4 pt-6 pb-5 overflow-hidden">
        <div
          className="absolute inset-x-0 -top-16 h-48 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 80% at 15% 30%, hsl(var(--accent) / 0.18), transparent 60%), radial-gradient(50% 70% at 90% 10%, hsl(var(--primary) / 0.18), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              <Building2 className="h-3 w-3" />
              Companies
            </div>
            <h1 className="text-[30px] leading-[1.05] font-bold tracking-tight">
              Explore
              <br />
              <span className="text-gradient-hero">Top Employers</span>
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[34ch]">
              Search companies and read reviews from students and alumni.
            </p>
          </div>

          <CompanySearch onSelect={handleCompanySelect} placeholder="Search companies..." />
        </div>
      </header>

      <div className="px-4 mb-2.5">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          All companies
        </h2>
      </div>

      <div className="px-4 space-y-2.5">
        {isLoading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-secondary/60 animate-pulse" />
          ))}

        {!isLoading &&
          (companies ?? []).map((c: Company) => (
            <button
              key={c.id}
              onClick={() => handleCompanySelect(c)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4 flex items-center gap-3 shadow-card hover:border-border-strong transition-smooth press-scale"
            >
              {c.logo ? (
                <img
                  src={c.logo}
                  alt=""
                  className="h-10 w-10 rounded-xl object-contain bg-muted shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{c.name}</span>
                {c.industry && (
                  <span className="block text-xs text-muted-foreground truncate">{c.industry}</span>
                )}
              </span>
              <Star className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}

        {!isLoading && (companies ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">No companies yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompaniesScreen;
