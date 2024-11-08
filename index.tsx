"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laugh, ThumbsUp, ThumbsDown, Heart, Share2, Sun, Moon } from "lucide-react"
import Cookies from 'js-cookie'

type Joke = {
  id: string
  setup?: string
  delivery?: string
  joke?: string
  rating: number
}

const CATEGORIES = ["Programming", "Misc", "Pun", "Spooky", "Christmas"]

export default function EnhancedJokeGenerator() {
  const [joke, setJoke] = useState<Joke | null>(null)
  const [category, setCategory] = useState<string>("Any")
  const [isLoading, setIsLoading] = useState(false)
  const [favorites, setFavorites] = useState<Joke[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const savedFavorites = Cookies.get('favoriteJokes')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode)
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const fetchJoke = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://v2.jokeapi.dev/joke/${category === "Any" ? "Any" : category}?safe-mode`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch joke")
      }
      const data = await response.json()
      setJoke({ ...data, id: data.id, rating: 0 })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch joke. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = () => {
    if (joke) {
      const newFavorites = favorites.some((fav) => fav.id === joke.id)
        ? favorites.filter((fav) => fav.id !== joke.id)
        : [...favorites, joke]
      setFavorites(newFavorites)
      Cookies.set('favoriteJokes', JSON.stringify(newFavorites), { expires: 30 })
      toast({
        title: newFavorites.length > favorites.length ? "Joke added to favorites" : "Joke removed from favorites",
        description: joke.setup || joke.joke,
      })
    }
  }

  const shareJoke = () => {
    if (joke) {
      const jokeText = joke.setup ? `${joke.setup} ${joke.delivery}` : joke.joke
      if (navigator.share) {
        navigator.share({
          title: 'Check out this joke!',
          text: jokeText,
        }).then(() => {
          toast({
            title: "Joke shared successfully!",
            description: "Thanks for spreading the laughter!",
          })
        }).catch((error) => {
          console.error('Error sharing:', error)
          fallbackShare(jokeText)
        })
      } else {
        fallbackShare(jokeText)
      }
    }
  }

  const fallbackShare = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Joke copied to clipboard",
      description: "You can now paste and share it with your friends!",
    })
  }

  const rateJoke = async (rating: number) => {
    if (joke) {
      setJoke({ ...joke, rating })
      try {
        const response = await fetch('https://v2.jokeapi.dev/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formatVersion: 3,
            joke: joke.id,
            rating: rating > 0 ? 1 : -1,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to submit rating')
        }
        toast({
          title: "Thanks for rating!",
          description: rating > 0 ? "Glad you enjoyed the joke!" : "We'll try to find better jokes for you.",
        })
      } catch (error) {
        console.error('Error submitting rating:', error)
        toast({
          title: "Error",
          description: "Failed to submit rating. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? "dark" : ""}`}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Laugh className="mr-2" />
              Random Joke Generator
            </span>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                aria-label="Toggle dark mode"
              />
              <Moon className="h-4 w-4" />
            </div>
          </CardTitle>
          <CardDescription>Select a category and get ready to laugh!</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jokes">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jokes">Jokes</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="jokes" className="space-y-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : joke ? (
                <div className="bg-muted p-4 rounded-md">
                  {joke.setup ? (
                    <>
                      <p className="font-medium mb-2">{joke.setup}</p>
                      <p className="italic">{joke.delivery}</p>
                    </>
                  ) : (
                    <p>{joke.joke}</p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Click the button to generate a joke!</p>
              )}
              {joke && (
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => rateJoke(1)} aria-label="Like joke">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => rateJoke(-1)} aria-label="Dislike joke">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleFavorite}
                      aria-label={favorites.some((fav) => fav.id === joke.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.some((fav) => fav.id === joke.id) ? "fill-current text-red-500" : ""
                        }`}
                      />
                    </Button>
                    <Button variant="outline" size="icon" onClick={shareJoke} aria-label="Share joke">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <Button onClick={fetchJoke} className="w-full" disabled={isLoading}>
                {isLoading ? "Fetching Joke..." : "Generate Joke"}
              </Button>
              {favorites.length > 0 && (
                <div className="w-full">
                  <h3 className="font-semibold mb-2">Favorite Jokes:</h3>
                  <ul className="space-y-2">
                    {favorites.map((fav) => (
                      <li key={fav.id} className="bg-muted p-2 rounded-md text-sm">
                        {fav.setup ? `${fav.setup} ${fav.delivery}` : fav.joke}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
            <TabsContent value="about">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">About Random Joke Generator</h2>
                <p>
                  Welcome to the Random Joke Generator! This app is designed to bring a smile to your face with a
                  variety of jokes from different categories.
                </p>
                <h3 className="text-lg font-semibold">Features:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Choose from various joke categories</li>
                  <li>Rate jokes you like or dislike</li>
                  <li>Save your favorite jokes</li>
                  <li>Easily share jokes with friends</li>
                  <li>Toggle between light and dark mode for comfortable viewing</li>
                </ul>
                <p>
                  We use the JokeAPI to fetch jokes. All jokes are filtered for safe content, but please remember that
                  humor is subjective, and what's funny to one person might not be to another.
                </p>
                <p>Enjoy the laughter and have fun!</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}