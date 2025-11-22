import { Calendar, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Schedule = () => {
  const schedules = [
    {
      day: "Montag & Mittwoch",
      time: "06:30 Uhr",
      location: "Zürich HB, Haupteingang",
      distance: "8-10 km",
      pace: "Gemütlich bis mittel",
    },
    {
      day: "Freitag",
      time: "06:00 Uhr",
      location: "Zürichsee, Bellevue",
      distance: "12-15 km",
      pace: "Mittel bis sportlich",
    },
    {
      day: "Sonntag",
      time: "07:00 Uhr",
      location: "Uetliberg, Bergstation",
      distance: "Variiert",
      pace: "Trail & Bergläufe",
    },
  ];

  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Trainingszeiten
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Wir treffen uns mehrmals pro Woche. Komm einfach vorbei und lauf mit!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {schedules.map((schedule, index) => (
            <Card 
              key={index}
              className="border-2 hover:scale-105 transition-transform duration-300"
            >
              <CardHeader className="bg-gradient-sunrise text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {schedule.day}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">{schedule.time}</p>
                    <p className="text-sm text-muted-foreground">Start</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">{schedule.location}</p>
                    <p className="text-sm text-muted-foreground">Treffpunkt</p>
                  </div>
                </div>
                <div className="pt-4 border-t space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Distanz:</span> {schedule.distance}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Tempo:</span> {schedule.pace}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
