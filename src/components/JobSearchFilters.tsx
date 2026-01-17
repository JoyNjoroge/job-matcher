import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { JobType, ExperienceLevel } from "@/types";

interface JobSearchFiltersProps {
  selectedJobTypes: JobType[];
  selectedExperienceLevels: ExperienceLevel[];
  onJobTypeChange: (types: JobType[]) => void;
  onExperienceLevelChange: (levels: ExperienceLevel[]) => void;
}

const jobTypes: { value: JobType; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Manager" },
];

export function JobSearchFilters({
  selectedJobTypes,
  selectedExperienceLevels,
  onJobTypeChange,
  onExperienceLevelChange,
}: JobSearchFiltersProps) {
  const handleJobTypeToggle = (type: JobType) => {
    if (selectedJobTypes.includes(type)) {
      onJobTypeChange(selectedJobTypes.filter((t) => t !== type));
    } else {
      onJobTypeChange([...selectedJobTypes, type]);
    }
  };

  const handleExperienceLevelToggle = (level: ExperienceLevel) => {
    if (selectedExperienceLevels.includes(level)) {
      onExperienceLevelChange(selectedExperienceLevels.filter((l) => l !== level));
    } else {
      onExperienceLevelChange([...selectedExperienceLevels, level]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Type */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Job Type</h4>
        <div className="space-y-2">
          {jobTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`job-type-${type.value}`}
                checked={selectedJobTypes.includes(type.value)}
                onCheckedChange={() => handleJobTypeToggle(type.value)}
              />
              <Label
                htmlFor={`job-type-${type.value}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Experience</h4>
        <div className="space-y-2">
          {experienceLevels.map((level) => (
            <div key={level.value} className="flex items-center space-x-2">
              <Checkbox
                id={`exp-${level.value}`}
                checked={selectedExperienceLevels.includes(level.value)}
                onCheckedChange={() => handleExperienceLevelToggle(level.value)}
              />
              <Label
                htmlFor={`exp-${level.value}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {level.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
